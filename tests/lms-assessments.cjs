// Integration test: use only a disposable database on a separate test server.
// LMS_TEST_PORT=33317 node tests/lms-assessments.cjs
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
if(!process.env.LMS_TEST_PORT)throw Error('Set LMS_TEST_PORT to a disposable MariaDB instance.');
const mysql=require('mysql2/promise');
const name='communityhub_lms_test_'+process.pid;
process.env.DB_HOST='127.0.0.1';process.env.DB_PORT=process.env.LMS_TEST_PORT;process.env.DB_USER='root';process.env.DB_PASSWORD='';process.env.DB_NAME=name;
async function run(){
 const admin=await mysql.createConnection({host:'127.0.0.1',port:Number(process.env.LMS_TEST_PORT),user:'root',multipleStatements:true});
 const db=require('../src/db');
 try{
  await admin.query(`CREATE DATABASE ${name}; USE ${name};
   CREATE TABLE users(id BIGINT UNSIGNED PRIMARY KEY,department_id BIGINT UNSIGNED NULL,fivem_license VARCHAR(100),is_active BOOLEAN DEFAULT TRUE);
   CREATE TABLE departments(id BIGINT UNSIGNED PRIMARY KEY);
   CREATE TABLE certifications(id BIGINT UNSIGNED PRIMARY KEY,name VARCHAR(100));
   CREATE TABLE user_certifications(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED,certification_id BIGINT UNSIGNED,awarded_by BIGINT UNSIGNED NULL,awarded_at DATETIME,expires_at DATETIME NULL,notes TEXT,UNIQUE KEY(user_id,certification_id));
   CREATE TABLE notifications(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED,title VARCHAR(180),message TEXT,url VARCHAR(500));
   CREATE TABLE audit_logs_v2(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED,action VARCHAR(120),entity_type VARCHAR(80),entity_id BIGINT UNSIGNED,metadata_json LONGTEXT);
   CREATE TABLE fivem_servers(id BIGINT UNSIGNED PRIMARY KEY,server_key VARCHAR(100),is_enabled BOOLEAN);
   CREATE TABLE fivem_api_keys(id BIGINT UNSIGNED PRIMARY KEY,server_id BIGINT UNSIGNED,key_hash VARCHAR(64),is_active BOOLEAN,last_used_at DATETIME);
   INSERT INTO users VALUES(1,1,'license:learner',1),(2,1,'license:other',1),(3,1,'license:inactive',0);
   INSERT INTO departments VALUES(1); INSERT INTO certifications VALUES(1,'Orientation'); INSERT INTO fivem_servers VALUES(1,'primary',1);`);
  for(const file of ['015_communityhub_flow.sql','021_lms_courses.sql','022_lms_assessment_attempts.sql','022_lms_assessment_attempts.sql'])await admin.query(fs.readFileSync(path.join(__dirname,'../sql/migrations',file),'utf8'));
  const lms=require('../src/services/lms'),author=require('../src/services/lmsAuthoring'),game=require('../src/services/gameLearning');
  assert.throws(()=>author.questionInput({question_text:'Q',choices:'a\nb',correct_choice:3}),/valid correct/);
  await db.query("INSERT INTO lms_courses(id,title,slug,status,certification_id,certificate_valid_days) VALUES(1,'Orientation','orientation','draft',1,30)");
  await author.addStructure(1,null,{title:'Basics'});
  await author.addStructure(1,1,{title:'Read',lesson_type:'content',is_required:1});
  await author.addStructure(1,1,{title:'Assessment',lesson_type:'quiz',is_required:1});
  const settings={title:'Orientation',status:'published',certification_id:1,certificate_valid_days:30};
  await assert.rejects(author.settings(1,settings),/no questions/);
  await author.addQuestion(1,2,{question_text:'Choose the correct answer',choices:'Correct\nIncorrect',correct_choice:1,points:3});
  await author.addQuestion(1,2,{question_text:'True?',question_type:'true_false',correct_choice:1,points:1});
  await author.settings(1,settings);
  await assert.rejects(author.addQuestion(1,2,{}));
  await db.query("INSERT INTO lms_enrollments(course_id,user_id) VALUES(1,1)");
  await db.query("INSERT INTO automation_flows(name,trigger_type) VALUES('Notify','lms_completed')");
  await db.query(`INSERT INTO automation_actions(flow_id,action_type,action_config_json) VALUES(1,'create_notification',?)`,[JSON.stringify({title:'Workflow',message:'Training complete'})]);
  await assert.rejects(lms.complete(2,1,1),/Enroll/);
  await assert.rejects(lms.complete(1,1,2),/Submit/);
  await assert.rejects(lms.complete(1,1,2,{1:3,2:3}),/listed choices/);
  const data=await lms.assessment(db,2);assert(data.answers.every(a=>!('is_correct' in a)));
  assert.equal(lms.grade([{id:1,points:3},{id:2,points:1}],[{id:1,question_id:1,is_correct:1},{id:2,question_id:1,is_correct:0},{id:3,question_id:2,is_correct:1},{id:4,question_id:2,is_correct:0}],{1:1,2:4}),75);
  await lms.complete(1,1,1);
  assert.equal((await lms.complete(1,1,2,{1:2,2:4})).passed,false);
  let [[e]]=await db.query('SELECT * FROM lms_enrollments WHERE user_id=1');assert.equal(e.status,'in_progress');assert.equal(Number(e.progress_percent),50);
  // Award failure rolls back the pass, attempt, enrollment, certification and notification.
  await db.query("CREATE TRIGGER reject_lms_notification BEFORE INSERT ON notifications FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Test award failure'");
  await assert.rejects(lms.complete(1,1,2,{1:1,2:3}),/Test award failure/);
  [[e]]=await db.query('SELECT * FROM lms_enrollments WHERE user_id=1');assert.equal(e.status,'in_progress');
  const [[rolledBack]]=await db.query('SELECT COUNT(*) n FROM user_certifications');assert.equal(rolledBack.n,0);
  await db.query('DROP TRIGGER reject_lms_notification');
  // Simultaneous duplicate submissions must produce one award and one flow run.
  await Promise.all([lms.complete(1,1,2,{1:1,2:3}),lms.complete(1,1,2,{1:1,2:3})]);
  [[e]]=await db.query('SELECT * FROM lms_enrollments WHERE user_id=1');assert.equal(e.status,'completed');assert.equal(Number(e.final_score),100);
  const [[cert]]=await db.query('SELECT *,TIMESTAMPDIFF(DAY,awarded_at,expires_at) days FROM user_certifications');assert.equal(cert.days,30);
  const [[runs]]=await db.query('SELECT COUNT(*) n FROM automation_runs');assert.equal(runs.n,1);
  const [[notes]]=await db.query('SELECT COUNT(*) n FROM notifications');assert.equal(notes.n,2);
  const [[attempts]]=await db.query('SELECT COUNT(*) n FROM lms_assessment_attempts');assert.equal(attempts.n,2);
  assert.equal((await game.progress('license:learner','primary')).courses.length,1);
  assert.equal((await game.progress('license:other','primary')).courses.length,0);
  assert.equal((await game.requirements('license:learner','primary')).courses[0].required_lessons.length,2);
  await assert.rejects(game.progress('license:inactive','primary'),/inactive/);
  await assert.rejects(game.progress('missing','primary'),/not linked/);
  await assert.rejects(game.progress('license:learner','wrong'),/disabled/);
  const express=require('express'),crypto=require('crypto'),app=express();
  const key=crypto.randomBytes(24).toString('hex');
  await db.query('INSERT INTO fivem_api_keys VALUES(1,1,?,1,NULL)',[crypto.createHash('sha256').update(key).digest('hex')]);
  app.use('/api/fivem',require('../src/routes/fivemApi'));
  const listener=app.listen(0,'127.0.0.1');
  await new Promise(r=>listener.once('listening',r));
  try{
    const base='http://127.0.0.1:'+listener.address().port+'/api/fivem/lms/';
    const get=(endpoint,params,credential=key)=>fetch(base+endpoint+'?'+new URLSearchParams(params),{headers:{'x-communityhub-key':credential}});
    assert.equal((await get('progress',{license:'license:learner',server_key:'primary'},'bad')).status,401);
    assert.equal((await get('progress',{license:'license:learner',server_key:'wrong'})).status,403);
    assert.equal((await get('progress',{license:'license:learner'})).status,400);
    const response=await get('requirements',{license:'license:learner',server_key:'primary'});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
    const payload=await response.json();assert.equal(payload.courses[0].id,1);assert(!JSON.stringify(payload).includes('is_correct'));assert(!JSON.stringify(payload).includes('answer_text'));
    assert.equal((await get('progress',{license:'license:inactive',server_key:'primary'})).status,403);
  }finally{await new Promise(r=>listener.close(r));}
  console.log('LMS integration passed: MariaDB migration/replay, authoring, grading, retries, concurrent completion, certification expiry, workflow and linked-user isolation.');
 }finally{await db.end();await admin.query(`DROP DATABASE IF EXISTS ${name}`);await admin.end();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
