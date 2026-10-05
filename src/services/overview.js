const db=require('../db');
const {REVIEW_ROLES}=require('../middleware/auth');
async function load(user){
  const reviewer=REVIEW_ROLES.includes(user.role);const flowManager=['admin','management','owner'].includes(user.role);
  const [serverResult,unitResult,trainingResult,calendarResult,applicationResult,patrolResult,announcementResult,reviewResult,flowResult,staffResult]=await Promise.all([
    db.query("SELECT name,current_players,max_players,last_heartbeat_at,game_hours,game_minutes,game_clock_at,IF(last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),1,0) live FROM fivem_servers WHERE is_enabled=1 ORDER BY id"),
    db.query("SELECT a.callsign,a.player_name,a.department,a.rank_name,a.duty_status,s.name server_name FROM fivem_active_units a JOIN fivem_servers s ON s.id=a.server_id WHERE a.last_seen_at>DATE_SUB(NOW(),INTERVAL 90 SECOND) AND s.is_enabled=1 AND s.last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND) ORDER BY a.department,a.callsign"),
    db.query('SELECT id,title,start_at,location FROM training_sessions WHERE start_at>=NOW() ORDER BY start_at LIMIT 4'),
    db.query('SELECT id,title,start_at,event_type FROM calendar_events WHERE start_at>=NOW() ORDER BY start_at LIMIT 4'),
    db.query('SELECT a.id,a.status,a.submitted_at,f.title FROM applications a JOIN application_forms f ON f.id=a.form_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 4',[user.id]),
    db.query("SELECT p.clocked_in_at,p.callsign,d.name department_name,s.name server_name FROM patrol_sessions p LEFT JOIN departments d ON d.id=p.department_id LEFT JOIN fivem_servers s ON s.id=p.server_id WHERE p.user_id=? AND p.status='active' LIMIT 1",[user.id]),
    db.query('SELECT title,message,priority FROM fivem_announcements WHERE is_active=1 AND (expires_at IS NULL OR expires_at>NOW()) ORDER BY id DESC LIMIT 4'),
    reviewer?db.query("SELECT (SELECT COUNT(*) FROM applications WHERE status='submitted') applications,(SELECT COUNT(*) FROM reports WHERE status='open') reports,(SELECT COUNT(*) FROM applications WHERE status='interview') interviews"):Promise.resolve([[]]),
    flowManager?db.query("SELECT r.id,r.status,r.trigger_type,r.error_message,r.started_at,f.name flow_name FROM automation_runs r JOIN automation_flows f ON f.id=r.flow_id WHERE r.status='failed' ORDER BY r.started_at DESC LIMIT 5"):Promise.resolve([[]]),
    reviewer?db.query("SELECT COUNT(*) probation,(SELECT COUNT(*) FROM staff_profiles WHERE activity_status IN ('watch','inactive')) activity_attention FROM staff_profiles WHERE probation_status IN ('active','extended')"):Promise.resolve([[]])
  ]);
  const servers=serverResult[0];const online=servers.filter(s=>Number(s.live));const offline=servers.filter(s=>!Number(s.live));const review=reviewer?(reviewResult[0][0]||{applications:0,reports:0,interviews:0}):null;const staff=reviewer?(staffResult[0][0]||{probation:0,activity_attention:0}):null;const flowFailures=flowResult[0]||[];const attention=[];
  offline.forEach(s=>attention.push({severity:'critical',title:`${s.name} is not reporting`,detail:s.last_heartbeat_at?`Last heartbeat ${new Date(s.last_heartbeat_at).toLocaleString()}`:'No heartbeat received',url:'/fivem/status'}));
  if(review&&Number(review.applications))attention.push({severity:'warning',title:`${review.applications} application${Number(review.applications)===1?'':'s'} awaiting review`,detail:'New submissions are waiting for staff action.',url:'/admin'});
  if(review&&Number(review.reports))attention.push({severity:'warning',title:`${review.reports} open report${Number(review.reports)===1?'':'s'}`,detail:'Reports require staff review or assignment.',url:'/admin'});
  if(staff&&Number(staff.activity_attention))attention.push({severity:'warning',title:`${staff.activity_attention} staff profile${Number(staff.activity_attention)===1?'':'s'} need activity attention`,detail:'Activity status is watch or inactive.',url:'/personnel'});
  flowFailures.forEach(r=>attention.push({severity:'critical',title:`Flow failed: ${r.flow_name}`,detail:r.error_message||`${r.trigger_type.replaceAll('_',' ')} execution failed.`,url:'/admin/automations'}));
  return {servers,offline,units:unitResult[0],training:trainingResult[0],calendar:calendarResult[0],applications:applicationResult[0],patrol:patrolResult[0][0]||null,announcements:announcementResult[0],review,staff,flowFailures,attention:attention.slice(0,8),players:online.reduce((n,s)=>n+Number(s.current_players||0),0),online:online.length,updatedAt:new Date().toISOString()};
}
module.exports={load};
