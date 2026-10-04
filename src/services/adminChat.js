const db=require('../db');
const ADMIN_ROLES=['admin','management','owner'];
async function handle(license,serverKey,message){
  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    // Lock/re-read the actor for every read/send; client-supplied roles are ignored.
    const [[actor]]=await conn.query('SELECT id,role FROM users WHERE fivem_license=? FOR UPDATE',[license]);
    if(!actor||!ADMIN_ROLES.includes(actor.role)){await conn.rollback();return {ok:false,status:403,error:'Admin chat requires a linked admin, management or owner account.'};}
    const [[server]]=await conn.query('SELECT id FROM fivem_servers WHERE server_key=?',[serverKey||'primary']);
    if(!server){await conn.rollback();return {ok:false,status:404,error:'Server not configured'};}
    if(message!==undefined){
      if(typeof message!=='string'||!message.trim()||message.trim().length>1000){await conn.rollback();return {ok:false,status:400,error:'Enter a message between 1 and 1000 characters.'};}
      const [[recent]]=await conn.query('SELECT COUNT(*) count FROM fivem_admin_chat WHERE user_id=? AND created_at>DATE_SUB(NOW(),INTERVAL 30 SECOND)',[actor.id]);
      if(Number(recent.count)>=10){await conn.rollback();return {ok:false,status:429,error:'Please wait before sending more admin chat messages.'};}
      await conn.query('INSERT INTO fivem_admin_chat(server_id,user_id,message) VALUES(?,?,?)',[server.id,actor.id,message.trim()]);
    }
    const [messages]=await conn.query('SELECT c.id,c.message,c.created_at,u.display_name,u.discord_username FROM fivem_admin_chat c JOIN users u ON u.id=c.user_id WHERE c.server_id=? ORDER BY c.id DESC LIMIT 100',[server.id]);
    await conn.commit();return {ok:true,messages:messages.reverse()};
  }catch(error){await conn.rollback();throw error;}finally{conn.release();}
}
module.exports={ADMIN_ROLES,handle};
