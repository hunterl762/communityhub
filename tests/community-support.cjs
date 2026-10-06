// Run against a disposable MariaDB server: COMMUNITY_TEST_PORT=33318 node tests/community-support.cjs
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
if(!process.env.COMMUNITY_TEST_PORT)throw Error('Set COMMUNITY_TEST_PORT to a disposable MariaDB instance.');
const name='communityhub_content_test_'+process.pid;
Object.assign(process.env,{DB_HOST:'127.0.0.1',DB_PORT:process.env.COMMUNITY_TEST_PORT,DB_USER:'root',DB_PASSWORD:'',DB_NAME:name});
async function run(){
 const admin=await require('mysql2/promise').createConnection({host:'127.0.0.1',port:Number(process.env.DB_PORT),user:'root',multipleStatements:true});
 const db=require('../src/db');let listener;
 try{
  await admin.query(`CREATE DATABASE ${name}; USE ${name};
  CREATE TABLE users(id BIGINT UNSIGNED PRIMARY KEY,role VARCHAR(40),is_active BOOLEAN,display_name VARCHAR(100),fivem_license VARCHAR(100));
  INSERT INTO users VALUES(1,'member',1,'Member One','license:one'),(2,'member',1,'Member Two','license:two'),(3,'staff',1,'Support','license:staff'),(4,'admin',0,'Inactive','license:inactive'),(5,'department_command',1,'Department','license:command');
  CREATE TABLE notifications(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED,title VARCHAR(180),message TEXT,url VARCHAR(500));
  CREATE TABLE audit_logs_v2(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED,action VARCHAR(120),entity_type VARCHAR(80),entity_id BIGINT UNSIGNED,metadata_json LONGTEXT);
  CREATE TABLE fivem_servers(id BIGINT UNSIGNED PRIMARY KEY,server_key VARCHAR(100),is_enabled BOOLEAN);
  INSERT INTO fivem_servers VALUES(1,'primary',1),(2,'disabled',0);
  CREATE TABLE fivem_api_keys(id BIGINT UNSIGNED PRIMARY KEY,server_id BIGINT UNSIGNED,key_hash VARCHAR(64),is_active BOOLEAN,last_used_at DATETIME);`);
  const migration=fs.readFileSync(path.join(__dirname,'../sql/migrations/023_community_content_support.sql'),'utf8');await admin.query(migration);await admin.query(migration);
  const content=require('../src/services/communityContent'),support=require('../src/services/support'),game=require('../src/services/gameCommunity');
  const post={title:'Server update',category:'Changelog',summary:'What changed',tags:'training,update',body:'# Heading\n<script>alert(1)</script>\n[bad](javascript:alert(1))\n![image](https://example.com/tracker.png)',status:'draft'};
  await assert.rejects(content.save('news','new',1,post),/staff access/);
  await assert.rejects(content.save('news','new',4,post),/Active account/);
  const postId=await content.save('news','new',3,post);assert.equal((await content.news()).posts.length,0);await assert.rejects(content.post(postId),/not found/);
  await content.save('news',postId,3,{...post,status:'published'});
  const rendered=await content.post(postId);assert(rendered.html.includes('<h1>Heading</h1>'));assert(!rendered.html.includes('<script>'));assert(!rendered.html.includes('href="javascript:'));assert(!rendered.html.includes('<img'));
  assert.equal((await content.news('update')).posts.length,1);assert.equal((await content.news('%')).posts.length,0);
  const ruleId=await content.save('rules','new',3,{title:'Respect',category:'Conduct',body:'Treat other members respectfully.',status:'published',sort_order:1});assert.equal((await content.rules('conduct')).rules[0].id,ruleId);
  await assert.rejects(content.save('rules',ruleId,3,{title:'x',category:'y',body:'z',status:'published',sort_order:-1}));
  const ticketId=await support.create(1,{subject:'Help with training',category:'question',message:'I cannot access a lesson.'});
  assert.equal((await support.list(2)).tickets.length,0);await assert.rejects(support.list(1,true),/staff access/);await assert.rejects(support.list(5,true),/staff access/);
  await assert.rejects(support.thread(2,ticketId),/not found/);await assert.rejects(support.update(2,ticketId,{message:'intrusion'}),/not found/);
  await support.update(3,ticketId,{message:'Please try again.'});assert.equal((await support.thread(1,ticketId)).ticket.status,'waiting_on_member');
  await support.update(1,ticketId,{message:'It works now.'});assert.equal((await support.thread(1,ticketId)).ticket.status,'open');
  await assert.rejects(support.update(1,ticketId,{status:'closed'},true),/Only support staff/);
  await support.update(3,ticketId,{status:'closed'},true);await assert.rejects(support.update(1,ticketId,{message:'hello'}),/closed/);
  await support.update(3,ticketId,{status:'open'},true);
  // Failure after inserting a reply must roll back message and status.
  const before=(await support.thread(1,ticketId)).messages.length;
  await db.query("CREATE TRIGGER reject_support_audit BEFORE INSERT ON audit_logs_v2 FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Test audit failure'");
  await assert.rejects(support.update(1,ticketId,{message:'rollback'}),/Test audit failure/);assert.equal((await support.thread(1,ticketId)).messages.length,before);await db.query('DROP TRIGGER reject_support_audit');
  await assert.rejects(game.tickets('license:staff','primary',ticketId),/not found/);await assert.rejects(game.tickets('license:two','primary',ticketId),/not found/);
  assert.equal((await game.tickets('license:one','primary',ticketId)).messages.length,3);
  await assert.rejects(game.news('disabled',{}),/disabled/);await assert.rejects(game.tickets('license:inactive','primary'),/inactive/);
  const express=require('express'),session=require('express-session'),app=express();
  app.set('view engine','ejs');app.set('views',path.join(__dirname,'../views'));app.use(express.urlencoded({extended:true}));
  app.use(session({secret:crypto.randomBytes(32).toString('hex'),resave:false,saveUninitialized:false}));
  // Test-only session setup. Production obtains identity through its existing auth routes.
  app.use((req,res,next)=>{if(req.get('x-test-user'))req.session.user={id:Number(req.get('x-test-user')),role:'member'};Object.assign(res.locals,{communityName:'CommunityHub',user:req.session.user||null,currentPath:req.path,unreadNotifications:0,cookieAccepted:true});next();});
  app.use(require('../src/routes/community'));app.use('/api/fivem',require('../src/routes/fivemApi'));app.use((e,req,res,next)=>{console.error(e.code||e.message);res.sendStatus(500);});
  listener=app.listen(0,'127.0.0.1');await new Promise(r=>listener.once('listening',r));const base='http://127.0.0.1:'+listener.address().port;
  assert.equal((await fetch(base+'/support',{redirect:'manual'})).status,302);
  assert.equal((await fetch(base+'/news')).status,200);assert.equal((await fetch(base+'/rules')).status,200);
  assert.equal((await fetch(base+'/community/manage',{headers:{'x-test-user':'1'}})).status,403);
  const form=await fetch(base+'/support/new',{headers:{'x-test-user':'1'}}),html=await form.text(),cookie=form.headers.get('set-cookie').split(';')[0],token=html.match(/name="_csrf" value="([^"]+)"/)[1];
  const send=(url,body)=>fetch(base+url,{method:'POST',headers:{cookie},body:new URLSearchParams(body),redirect:'manual'});
  assert.equal((await send('/support',{subject:'CSRF test',category:'bug',message:'test'})).status,403);
  assert.equal((await send('/support',{_csrf:token,subject:'Valid form',category:'bug',message:'test'})).status,302);
  assert.equal((await send('/support/tickets/'+ticketId+'/status',{_csrf:token,status:'closed'})).status,403);
  const key=crypto.randomBytes(24).toString('hex');await db.query('INSERT INTO fivem_api_keys VALUES(1,1,?,1,NULL)',[crypto.createHash('sha256').update(key).digest('hex')]);
  const api=(url,params,credential=key)=>fetch(base+'/api/fivem'+url+'?'+new URLSearchParams(params),{headers:{'x-communityhub-key':credential}});
  assert.equal((await api('/community/news',{server_key:'primary'},'bad')).status,401);
  assert.equal((await api('/community/news',{server_key:'wrong'})).status,403);
  const response=await api('/community/news',{server_key:'primary'});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal((await response.json()).posts.length,1);
  assert.equal((await api('/support/tickets/'+ticketId,{server_key:'primary',license:'license:two'})).status,404);
  assert.equal((await api('/support/tickets/'+ticketId,{server_key:'primary',license:'license:staff'})).status,404);
  assert.equal((await api('/support/tickets/'+ticketId,{server_key:'primary',license:'license:one'})).status,200);
  console.log('Passed: MariaDB migration replay, publishing, Markdown safety, literal search, ticket isolation, staff permissions, reply/status workflow, rollback, CSRF and scoped FiveM API.');
 }finally{if(listener)await new Promise(r=>listener.close(r));await db.end();await admin.query(`DROP DATABASE IF EXISTS ${name}`);await admin.end();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
