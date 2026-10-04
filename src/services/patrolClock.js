const db=require('../db');
async function change(userId,action,source,serverKey){
  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    const [[user]]=await conn.query('SELECT id,department_id,callsign FROM users WHERE id=? FOR UPDATE',[userId]);
    if(!user){await conn.rollback();return {ok:false,error:'Account not found'};}
    const [[active]]=await conn.query("SELECT id FROM patrol_sessions WHERE user_id=? AND status='active' LIMIT 1",[userId]);
    if(action==='in'&&active){await conn.commit();return {ok:true,patrol_id:active.id,already_active:true};}
    if(action==='out'&&!active){await conn.commit();return {ok:true,already_clocked_out:true};}
    let patrolId=active?.id;
    if(action==='in'){
      const [[server]]=await conn.query('SELECT id FROM fivem_servers WHERE server_key=?',[serverKey||'primary']);
      if(!server){await conn.rollback();return {ok:false,error:'Server not configured'};}
      const [insert]=await conn.query('INSERT INTO patrol_sessions(user_id,server_id,department_id,callsign) VALUES(?,?,?,?)',[userId,server.id,user.department_id,user.callsign]);patrolId=insert.insertId;
    }else await conn.query("UPDATE patrol_sessions SET status='completed',clocked_out_at=NOW() WHERE user_id=? AND status='active'",[userId]);
    await conn.query('INSERT INTO patrol_clock_events(patrol_id,user_id,event_type,source) VALUES(?,?,?,?)',[patrolId,userId,action==='in'?'clock_in':'clock_out',source]);
    await conn.commit();return {ok:true,patrol_id:patrolId};
  }catch(error){await conn.rollback();throw error;}finally{conn.release();}
}
async function history(userId){
  const params=userId?[userId]:[];
  const [sessions]=await db.query(`SELECT p.id,p.status,p.clocked_in_at,p.clocked_out_at,p.callsign,
    u.display_name,u.discord_username,d.name department_name,s.name server_name,
    TIMESTAMPDIFF(SECOND,p.clocked_in_at,COALESCE(p.clocked_out_at,NOW())) duration_seconds
    FROM patrol_sessions p JOIN users u ON u.id=p.user_id LEFT JOIN departments d ON d.id=p.department_id
    LEFT JOIN fivem_servers s ON s.id=p.server_id ${userId?'WHERE p.user_id=?':''}
    ORDER BY p.clocked_in_at DESC,p.id DESC LIMIT 100`,params);
  const [events]=await db.query(`SELECT e.id,e.patrol_id,e.event_type,e.source,e.occurred_at,u.display_name,u.discord_username
    FROM patrol_clock_events e JOIN users u ON u.id=e.user_id ${userId?'WHERE e.user_id=?':''} ORDER BY e.id DESC LIMIT 100`,params);
  return {sessions,events};
}
module.exports={change,history};
