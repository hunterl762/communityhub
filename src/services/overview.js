const db=require('../db');
const {REVIEW_ROLES}=require('../middleware/auth');
async function load(user){
  const reviewer=REVIEW_ROLES.includes(user.role);
  const [serverResult,unitResult,trainingResult,calendarResult,applicationResult,patrolResult,announcementResult,reviewResult]=await Promise.all([
    db.query("SELECT name,current_players,max_players,last_heartbeat_at,game_hours,game_minutes,game_clock_at,IF(last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),1,0) live FROM fivem_servers WHERE is_enabled=1 ORDER BY id"),
    db.query("SELECT a.callsign,a.player_name,a.department,a.rank_name,a.duty_status,s.name server_name FROM fivem_active_units a JOIN fivem_servers s ON s.id=a.server_id WHERE a.last_seen_at>DATE_SUB(NOW(),INTERVAL 90 SECOND) AND s.is_enabled=1 AND s.last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND) ORDER BY a.department,a.callsign"),
    db.query('SELECT id,title,start_at,location FROM training_sessions WHERE start_at>=NOW() ORDER BY start_at LIMIT 4'),
    db.query('SELECT id,title,start_at,event_type FROM calendar_events WHERE start_at>=NOW() ORDER BY start_at LIMIT 4'),
    db.query('SELECT a.id,a.status,a.submitted_at,f.title FROM applications a JOIN application_forms f ON f.id=a.form_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 4',[user.id]),
    db.query("SELECT p.clocked_in_at,p.callsign,d.name department_name,s.name server_name FROM patrol_sessions p LEFT JOIN departments d ON d.id=p.department_id LEFT JOIN fivem_servers s ON s.id=p.server_id WHERE p.user_id=? AND p.status='active' LIMIT 1",[user.id]),
    db.query('SELECT title,message,priority FROM fivem_announcements WHERE is_active=1 AND (expires_at IS NULL OR expires_at>NOW()) ORDER BY id DESC LIMIT 4'),
    reviewer?db.query("SELECT (SELECT COUNT(*) FROM applications WHERE status='submitted') applications,(SELECT COUNT(*) FROM reports WHERE status='open') reports"):Promise.resolve([[]])
  ]);
  const servers=serverResult[0];const online=servers.filter(s=>Number(s.live));
  return {servers,units:unitResult[0],training:trainingResult[0],calendar:calendarResult[0],applications:applicationResult[0],patrol:patrolResult[0][0]||null,announcements:announcementResult[0],review:reviewer?(reviewResult[0][0]||{applications:0,reports:0}):null,players:online.reduce((n,s)=>n+Number(s.current_players||0),0),online:online.length,updatedAt:new Date().toISOString()};
}
module.exports={load};
