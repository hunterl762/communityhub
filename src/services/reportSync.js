const db=require('../db');
const STATUSES=['open','under_review','actioned','dismissed','closed'];
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
async function publish(conn,gameId){
 const [[existing]]=await conn.query('SELECT id FROM reports WHERE fivem_report_id=?',[gameId]);if(existing)return existing.id;
 const [[f]]=await conn.query('SELECT f.*,s.name server_name FROM fivem_reports f LEFT JOIN fivem_servers s ON s.id=f.server_id WHERE f.id=?',[gameId]);if(!f)fail('Report not found.',404);
 const description=`In-game report: ${f.subject}\n\n${f.details}\n\nServer: ${f.server_name||'Unknown'}\nPostal: ${f.postal_code||'Unavailable'}`;
 const [r]=await conn.query('INSERT INTO reports(reporter_user_id,report_type,description,status,assigned_to,created_at,fivem_report_id) VALUES(?,?,?,?,?,?,?)',[f.reporter_user_id,f.report_type,description,f.status,f.assigned_to,f.created_at,f.id]);return r.insertId;
}
async function submit(data){
 const reportedName=String(data.reported_name||'').trim();if(reportedName.length>150)fail('Reported player name must be no more than 150 characters.');
 const subject=String(data.subject||'').trim(),details=String(data.details||'').trim();
 if(!subject||subject.length>160||!details||details.length>10000)fail('Provide a subject (up to 160 characters) and details (up to 10000 characters).');
 const types={failrp:'FailRP',vdm:'VDM',rdm:'RDM',player:'Player Report',staff:'Staff Report',other:'Other'};
 if(!Object.hasOwn(types,data.report_type))fail('Select a valid report category.');
 const conn=await db.getConnection();try{await conn.beginTransaction();
  const [[server]]=await conn.query('SELECT id FROM fivem_servers WHERE server_key=? AND is_enabled=1',[data.server_key||'primary']);if(!server)fail('Server not configured or disabled.',404);
  const [[user]]=await conn.query('SELECT id,is_active FROM users WHERE fivem_license=?',[data.license||'']);if(user&&!user.is_active)fail('Account is inactive.',403);
  const coords=['position_x','position_y'].map(k=>typeof data[k]==='number'&&Number.isFinite(data[k])&&Math.abs(data[k])<=20000?data[k]:null);
  const postal=require('./postals').nearest(...coords)?.code||null;
  const [r]=await conn.query('INSERT INTO fivem_reports(reporter_user_id,server_id,report_type,subject,details,postal_code,position_x,position_y) VALUES(?,?,?,?,?,?,?,?)',[user?.id||null,server.id,types[data.report_type],subject,details,postal,...coords]);
  const websiteId=await publish(conn,r.insertId);await conn.query('UPDATE reports SET reported_name=? WHERE id=?',[reportedName||null,websiteId]);await conn.commit();return {ok:true,report_id:r.insertId,website_report_id:websiteId};
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
async function webStatus(reportId,userId,status,resolution){
 if(!STATUSES.includes(status))fail('Select a valid report status.');
 const conn=await db.getConnection();try{await conn.beginTransaction();
  const [[report]]=await conn.query('SELECT id,fivem_report_id FROM reports WHERE id=?',[reportId]);if(!report)fail('Report not found.',404);
  // Keep game->website and website->game writes in the same lock order.
  if(report.fivem_report_id)await conn.query('SELECT id FROM fivem_reports WHERE id=? FOR UPDATE',[report.fivem_report_id]);
  await conn.query('UPDATE reports SET status=?,assigned_to=?,resolution=? WHERE id=?',[status,userId,resolution,report.id]);
  if(report.fivem_report_id)await conn.query('UPDATE fivem_reports SET status=?,assigned_to=? WHERE id=?',[status,userId,report.fivem_report_id]);
  if(resolution)await conn.query('INSERT INTO report_comments(report_id,user_id,comment,is_internal) VALUES(?,?,?,1)',[report.id,userId,resolution]);
  await conn.commit();
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
module.exports={STATUSES,publish,submit,webStatus};
