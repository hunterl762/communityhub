const db = require('../db');
const STALE_MS = 90 * 1000;
let timer;
let checking = false;

function liveAt(heartbeat, now) {
  return !!heartbeat && new Date(now) - new Date(heartbeat) < STALE_MS;
}

// Used for both the watchdog and a heartbeat that arrives after an outage.
function nextPeriods(period, heartbeat, now, receivingHeartbeat) {
  now = new Date(now);
  const live = liveAt(heartbeat, now);
  if (!period) return [{state:receivingHeartbeat || live ? 'online' : 'offline',at:now}];
  const changes = [];
  if (period.state === 'online' && !live) {
    const expired = heartbeat ? new Date(new Date(heartbeat).getTime() + STALE_MS) : now;
    changes.push({state:'offline',at:new Date(Math.max(new Date(period.started_at).getTime(),expired.getTime()))});
  }
  if (receivingHeartbeat && (period.state === 'offline' || changes.length)) changes.push({state:'online',at:now});
  if (!receivingHeartbeat && live && period.state === 'offline') changes.push({state:'online',at:now});
  return changes;
}

async function observe(serverId, heartbeatData) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[server]] = await conn.query('SELECT *,NOW(3) observed_at FROM fivem_servers WHERE id=? FOR UPDATE',[serverId]);
    if (!server) { await conn.rollback(); return false; }
    const [[period]] = await conn.query('SELECT * FROM fivem_status_periods WHERE server_id=? AND open_marker=1',[serverId]);
    for (const change of nextPeriods(period,server.last_heartbeat_at,server.observed_at,!!heartbeatData)) {
      await conn.query('UPDATE fivem_status_periods SET ended_at=?,open_marker=NULL WHERE server_id=? AND open_marker=1',[change.at,serverId]);
      await conn.query('INSERT INTO fivem_status_periods(server_id,state,started_at) VALUES(?,?,?)',[serverId,change.state,change.at]);
    }
    if (heartbeatData) {
      await conn.query('UPDATE fivem_servers SET is_online=1,current_players=?,max_players=?,hostname=?,last_heartbeat_at=? WHERE id=?',[
        heartbeatData.players,heartbeatData.maxPlayers,heartbeatData.hostname,server.observed_at,serverId
      ]);
    } else {
      await conn.query('UPDATE fivem_servers SET is_online=? WHERE id=?',[liveAt(server.last_heartbeat_at,server.observed_at)?1:0,serverId]);
    }
    await conn.commit();
    return true;
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}

async function recordHeartbeat(data) {
  const players = Number(data.players || 0), maxPlayers = Number(data.max_players || 64);
  if (!Number.isInteger(players) || players < 0 || !Number.isInteger(maxPlayers) || maxPlayers < 1) {
    const error = new Error('Invalid heartbeat player counts'); error.status = 400; throw error;
  }
  const [[server]] = await db.query('SELECT id FROM fivem_servers WHERE server_key=?',[String(data.server_key || 'primary')]);
  if (!server) return false;
  return observe(server.id,{players,maxPlayers,hostname:String(data.hostname || '').slice(0,255)||null});
}

async function checkStatuses() {
  if (checking) return;
  checking = true;
  try {
    const [servers] = await db.query('SELECT id FROM fivem_servers ORDER BY id');
    for (const server of servers) await observe(server.id);
  } finally { checking = false; }
}

function startMonitor() {
  if (timer) return;
  const check = () => checkStatuses().catch(error=>console.error('[FiveM status monitor]',error.code || 'STATUS_CHECK_FAILED'));
  check(); timer = setInterval(check,15000); timer.unref();
}

async function snapshot() {
  const [servers] = await db.query(`SELECT s.id,s.name,s.server_key,s.max_players,s.last_heartbeat_at,s.game_hours,s.game_minutes,s.game_clock_at,
    IF(s.last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),1,0) live,
    IF(s.last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),s.current_players,0) current_players,
    p.state recorded_state,p.started_at state_since,
    history.tracked_since,COALESCE(history.online_seconds,0) online_seconds,
    COALESCE(history.offline_seconds,0) offline_seconds
    FROM fivem_servers s LEFT JOIN fivem_status_periods p ON p.server_id=s.id AND p.open_marker=1
    LEFT JOIN (SELECT server_id,MIN(started_at) tracked_since,
      SUM(IF(state='online',GREATEST(0,TIMESTAMPDIFF(SECOND,GREATEST(started_at,DATE_SUB(NOW(),INTERVAL 30 DAY)),COALESCE(ended_at,NOW()))),0)) online_seconds,
      SUM(IF(state='offline',GREATEST(0,TIMESTAMPDIFF(SECOND,GREATEST(started_at,DATE_SUB(NOW(),INTERVAL 30 DAY)),COALESCE(ended_at,NOW()))),0)) offline_seconds
      FROM fivem_status_periods GROUP BY server_id) history ON history.server_id=s.id ORDER BY s.id`);
  // Public/member output intentionally omits API keys, licenses and hostnames.
  const [history] = await db.query(`SELECT p.id,p.server_id,s.name server_name,p.state,p.started_at,p.ended_at,
    TIMESTAMPDIFF(SECOND,p.started_at,COALESCE(p.ended_at,NOW())) duration_seconds
    FROM fivem_status_periods p JOIN fivem_servers s ON s.id=p.server_id
    WHERE p.started_at>=DATE_SUB(NOW(),INTERVAL 30 DAY) OR p.ended_at IS NULL OR p.ended_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)
    ORDER BY p.started_at DESC,p.id DESC LIMIT 100`);
  return {servers,history,updatedAt:new Date().toISOString(),refreshSeconds:15};
}

module.exports = {STALE_MS,liveAt,nextPeriods,recordHeartbeat,checkStatuses,startMonitor,snapshot};
