const db=require('../db'),{actor,text,id,fail,audit,STAFF}=require('./communityContent');
const PRIORITIES=['low','normal','high','urgent'];
const STATUSES=['open','waiting_on_member','resolved','closed'];
async function list(userId,queue=false,status='',filters={}){
 const user=await actor(userId);if(queue&&!user.staff)fail('Support staff access required.',403);
 if(status&&!STATUSES.includes(status))fail('Invalid ticket status.');
 const priority=filters.priority||'',assigned=filters.assigned||'';if(priority&&!PRIORITIES.includes(priority))fail('Select a valid priority.');if(!['','mine','unassigned'].includes(assigned))fail('Select a valid assignment filter.');
 const [tickets]=await db.query(`SELECT t.id,t.subject,t.category,t.status,t.created_at,t.updated_at,u.display_name,COALESCE(tt.priority,'normal') priority,tt.assigned_to,a.display_name assigned_name FROM support_tickets t JOIN users u ON u.id=t.user_id LEFT JOIN support_ticket_triage tt ON tt.ticket_id=t.id LEFT JOIN users a ON a.id=tt.assigned_to WHERE (?=1 OR t.user_id=?) AND (?='' OR t.status=?) AND (?='' OR COALESCE(tt.priority,'normal')=?) AND (?='' OR (?='mine' AND tt.assigned_to=?) OR (?='unassigned' AND tt.assigned_to IS NULL)) ORDER BY FIELD(COALESCE(tt.priority,'normal'),'urgent','high','normal','low'),t.updated_at DESC,t.id DESC LIMIT 100`,[queue?1:0,userId,status,status,priority,priority,assigned,assigned,userId,assigned]);return {tickets,status,priority,assigned,queue,staff:user.staff};
}
async function thread(userId,ticketId,ownerOnly=false){
 const user=await actor(userId);const [[ticket]]=await db.query("SELECT t.*,COALESCE(tt.priority,'normal') priority,tt.assigned_to,a.display_name assigned_name FROM support_tickets t LEFT JOIN support_ticket_triage tt ON tt.ticket_id=t.id LEFT JOIN users a ON a.id=tt.assigned_to WHERE t.id=? AND (?=1 OR t.user_id=?)",[id(ticketId),user.staff&&!ownerOnly?1:0,userId]);if(!ticket)fail('Ticket not found.',404);
 const [messages]=await db.query('SELECT m.id,m.message,m.is_staff,m.created_at,u.display_name FROM support_messages m LEFT JOIN users u ON u.id=m.user_id WHERE m.ticket_id=? ORDER BY m.id DESC LIMIT 200',[ticket.id]);return {ticket,messages:messages.reverse(),staff:user.staff,assignees:user.staff&&!ownerOnly?await staffMembers():[]};
}
async function notifyStaff(conn,owner,ticketId,title,message){await conn.query(`INSERT INTO notifications(user_id,title,message,url) SELECT id,?,?,? FROM users WHERE is_active=1 AND role IN (${STAFF.map(()=>'?').join(',')}) AND id<>?`,[title,message,`/support/tickets/${ticketId}`,...STAFF,owner]);}
async function create(userId,body){
 const subject=text(body.subject,'Subject',180),message=text(body.message,'Message',10000),category=body.category;
 if(!['question','bug','report','appeal'].includes(category))fail('Select a ticket category.');
 const conn=await db.getConnection();try{await conn.beginTransaction();await actor(userId,conn);
 const [result]=await conn.query('INSERT INTO support_tickets(user_id,subject,category) VALUES(?,?,?)',[userId,subject,category]);
 await conn.query('INSERT INTO support_messages(ticket_id,user_id,message) VALUES(?,?,?)',[result.insertId,userId,message]);
 await notifyStaff(conn,userId,result.insertId,'New support ticket',subject);await audit(conn,userId,'support.created','support_ticket',result.insertId);await conn.commit();return result.insertId;
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
async function update(userId,ticketId,body,statusOnly=false,ownerOnly=false){
 const conn=await db.getConnection();try{await conn.beginTransaction();const user=await actor(userId,conn);
 const asStaff=user.staff&&!ownerOnly;
 const [[ticket]]=await conn.query('SELECT * FROM support_tickets WHERE id=? AND (?=1 OR user_id=?) FOR UPDATE',[id(ticketId),asStaff?1:0,userId]);if(!ticket)fail('Ticket not found.',404);
 let status;
 if(statusOnly){if(!asStaff)fail('Only support staff can change ticket status.',403);status=body.status;if(!STATUSES.includes(status))fail('Select a ticket status.');}
 else{
  if(ticket.status==='closed')fail('This ticket is closed. Ask support staff to reopen it.',409);
  const message=text(body.message,'Reply',10000);await conn.query('INSERT INTO support_messages(ticket_id,user_id,is_staff,message) VALUES(?,?,?,?)',[ticket.id,userId,asStaff?1:0,message]);status=asStaff?'waiting_on_member':'open';
 }
 await conn.query('UPDATE support_tickets SET status=?,updated_at=NOW() WHERE id=?',[status,ticket.id]);
 await audit(conn,userId,statusOnly?'support.status_changed':'support.replied','support_ticket',ticket.id,{from:ticket.status,to:status});
 if(asStaff&&String(ticket.user_id)!==String(userId))await conn.query('INSERT INTO notifications(user_id,title,message,url) VALUES(?,?,?,?)',[ticket.user_id,statusOnly?'Support ticket updated':'Support replied',statusOnly?`Your ticket is now ${status.replaceAll('_',' ')}.`:'You have a new reply to your support ticket.',`/support/tickets/${ticket.id}`]);
 if(!asStaff)await notifyStaff(conn,userId,ticket.id,'Support reply received',ticket.subject);
 await conn.commit();return ticket.id;
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
async function staffMembers(){const [users]=await db.query("SELECT id,display_name FROM users WHERE is_active=1 AND role IN ('staff','admin','management','owner') ORDER BY display_name,id");return users;}
async function triage(userId,ticketId,body){
 if(!PRIORITIES.includes(body.priority))fail('Select a valid priority.');
 const assigned=body.assigned_to===''||body.assigned_to==null?null:id(body.assigned_to);
 const conn=await db.getConnection();try{await conn.beginTransaction();const [[user]]=await conn.query('SELECT id,role,is_active FROM users WHERE id=? FOR UPDATE',[userId]);if(!user?.is_active||!STAFF.includes(user.role))fail('Support staff access required.',403);
 const [[ticket]]=await conn.query('SELECT id FROM support_tickets WHERE id=? FOR UPDATE',[id(ticketId)]);if(!ticket)fail('Ticket not found.',404);
 if(assigned){const [[target]]=await conn.query('SELECT id,role,is_active FROM users WHERE id=? FOR UPDATE',[assigned]);if(!target?.is_active||!STAFF.includes(target.role))fail('Assign tickets to active support staff only.');}
 const [[previous]]=await conn.query('SELECT assigned_to,priority FROM support_ticket_triage WHERE ticket_id=?',[ticket.id]);
 await conn.query('INSERT INTO support_ticket_triage(ticket_id,assigned_to,priority) VALUES(?,?,?) ON DUPLICATE KEY UPDATE assigned_to=VALUES(assigned_to),priority=VALUES(priority)',[ticket.id,assigned,body.priority]);
 await conn.query('UPDATE support_tickets SET updated_at=NOW() WHERE id=?',[ticket.id]);await audit(conn,userId,'support.triage_changed','support_ticket',ticket.id,{from:previous||{assigned_to:null,priority:'normal'},to:{assigned_to:assigned,priority:body.priority}});
 if(assigned&&String(previous?.assigned_to)!==String(assigned)&&String(assigned)!==String(userId))await conn.query('INSERT INTO notifications(user_id,title,message,url) VALUES(?,?,?,?)',[assigned,'Support ticket assigned','You have been assigned ticket #'+ticket.id,'/support/tickets/'+ticket.id]);
 await conn.commit();return ticket.id;
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
module.exports={STATUSES,PRIORITIES,list,thread,create,update,triage,staffMembers};
