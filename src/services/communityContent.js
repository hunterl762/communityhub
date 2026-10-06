const db=require('../db');
const markdown=require('markdown-it')({html:false,linkify:false,breaks:true});
markdown.disable('image');
const STAFF=['staff','admin','management','owner'];
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(value,name,max,optional=false)=>{if(typeof value!=='string'&&value!=null)fail(`Invalid ${name}.`);const s=String(value??'').trim();if((!optional&&!s)||s.length>max)fail(`${name} must be ${optional?'no more than':'between 1 and'} ${max} characters.`);return s;};
const id=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<1)fail('Invalid record.',404);return n;};
async function actor(userId,conn=db){const [[user]]=await conn.query('SELECT id,role,is_active FROM users WHERE id=?',[userId]);if(!user||!user.is_active)fail('Active account required.',403);return {...user,staff:STAFF.includes(user.role)};}
async function news(search='',category='',includeDrafts=false){
 const q=text(search,'Search',120,true),cat=text(category,'Category',80,true);
 const [posts]=await db.query(`SELECT id,title,category,tags,summary,status,published_at,updated_at FROM community_news WHERE (?=1 OR status='published') AND (?='' OR category=?) AND (?='' OR INSTR(LOWER(CONCAT(title,' ',summary,' ',COALESCE(tags,''))),LOWER(?))>0) ORDER BY COALESCE(published_at,created_at) DESC,id DESC LIMIT 100`,[includeDrafts?1:0,cat,cat,q,q]);
 const [categories]=await db.query("SELECT DISTINCT category FROM community_news WHERE status='published' ORDER BY category");return {posts,categories,q,category:cat};
}
async function post(postId,includeDrafts=false){const [[p]]=await db.query("SELECT * FROM community_news WHERE id=? AND (?=1 OR status='published')",[id(postId),includeDrafts?1:0]);if(!p)fail('News post not found.',404);return {...p,html:markdown.render(p.body)};}
async function rules(search='',includeDrafts=false){const q=text(search,'Search',120,true);const [rules]=await db.query("SELECT id,category,title,body,status,sort_order,updated_at FROM community_rules WHERE (?=1 OR status='published') AND (?='' OR INSTR(LOWER(CONCAT(title,' ',body,' ',category)),LOWER(?))>0) ORDER BY category,sort_order,id",[includeDrafts?1:0,q,q]);return {rules,q};}
async function rule(ruleId){const [[r]]=await db.query('SELECT * FROM community_rules WHERE id=?',[id(ruleId)]);if(!r)fail('Rule not found.',404);return r;}
async function audit(conn,userId,action,entity,recordId,metadata={}){await conn.query('INSERT INTO audit_logs_v2(user_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?)',[userId,action,entity,recordId,JSON.stringify(metadata)]);}
async function save(kind,recordId,userId,body){
 if(!['news','rules'].includes(kind))fail('Invalid content type.');
 const title=text(body.title,'Title',180),category=text(body.category,'Category',80),content=text(body.body,'Content',kind==='news'?50000:10000),status=body.status;
 if(!['draft','published','archived'].includes(status))fail('Select a publication status.');
 const tags=kind==='news'?text(body.tags,'Tags',300,true):null,summary=kind==='news'?text(body.summary,'Summary',500):null;
 const order=kind==='rules'?Number(body.sort_order||0):0;if(!Number.isInteger(order)||order<0||order>100000)fail('Order must be a whole number between 0 and 100000.');
 const conn=await db.getConnection();try{await conn.beginTransaction();const user=await actor(userId,conn);if(!user.staff)fail('Support staff access required.',403);
 let resultId=recordId==='new'?null:id(recordId);
 if(resultId){const [[old]]=await conn.query(`SELECT id FROM community_${kind} WHERE id=? FOR UPDATE`,[resultId]);if(!old)fail('Content not found.',404);}
 if(kind==='news'){
  if(resultId)await conn.query("UPDATE community_news SET title=?,category=?,tags=?,summary=?,body=?,status=?,published_at=IF(?='published',COALESCE(published_at,NOW()),published_at),updated_by=?,updated_at=NOW() WHERE id=?",[title,category,tags||null,summary,content,status,status,userId,resultId]);
  else{const [r]=await conn.query("INSERT INTO community_news(title,category,tags,summary,body,status,published_at,updated_by) VALUES(?,?,?,?,?,?,IF(?='published',NOW(),NULL),?)",[title,category,tags||null,summary,content,status,status,userId]);resultId=r.insertId;}
 }else{
  if(resultId)await conn.query('UPDATE community_rules SET title=?,category=?,body=?,status=?,sort_order=?,updated_by=?,updated_at=NOW() WHERE id=?',[title,category,content,status,order,userId,resultId]);
  else{const [r]=await conn.query('INSERT INTO community_rules(title,category,body,status,sort_order,updated_by) VALUES(?,?,?,?,?,?)',[title,category,content,status,order,userId]);resultId=r.insertId;}
 }
 await audit(conn,userId,'community.content_saved',`community_${kind}`,resultId,{status});await conn.commit();return resultId;
 }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
module.exports={STAFF,fail,text,id,actor,news,post,rules,rule,save,audit};
