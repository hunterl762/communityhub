const path=require('path'),fs=require('fs'),assert=require('node:assert/strict');const checkout=process.argv[2],root=process.argv[3]||checkout;
require(path.join(root,'node_modules/dotenv')).config({path:path.join(root,'.env'),quiet:true});const db=require(path.join(checkout,'src/db'));
let membership=true;require(path.join(checkout,'src/services/discord')).isGuildMember=async()=>{if(membership==='unavailable')throw Error('Discord unavailable');return membership;};
const apps=require(path.join(checkout,'src/services/applications')),ops=require(path.join(checkout,'src/services/operations')),branding=require(path.join(checkout,'src/services/branding'));
const unique='ops_'+Date.now(),license='license:'+unique;let departmentId,userId,serverId,server2,formId,personId,vehicleId,boloId,oldFlags,oldLogo;
const fails=(fn,status)=>assert.rejects(fn,e=>e.status===status);
(async()=>{
for(const sql of fs.readFileSync(path.join(checkout,'sql/migrations/010_tablet_operations.sql'),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.query(sql);console.log('Migration 010 applied.');
[oldFlags]=await db.query("SELECT setting_key,setting_value FROM site_settings WHERE setting_key LIKE 'tablet_%_enabled'");const [[logo]]=await db.query('SELECT * FROM community_branding WHERE id=1');oldLogo=logo;
await db.query("UPDATE site_settings SET setting_value='1' WHERE setting_key LIKE 'tablet_%_enabled'");
const [u]=await db.query("INSERT INTO users(username,display_name,role,discord_id,fivem_license) VALUES(?,?,'member',?,?)",[unique,'Temporary operations account',unique,license]);userId=u.insertId;
const [s]=await db.query('INSERT INTO fivem_servers(name,server_key,max_players) VALUES(?,?,64)',['Temporary operations server',unique]);serverId=s.insertId;
const [s2]=await db.query('INSERT INTO fivem_servers(name,server_key,max_players) VALUES(?,?,64)',['Temporary boundary server',unique+'_other']);server2=s2.insertId;
for(const role of ['applicant','recruit','member','reviewer']){await db.query('UPDATE users SET role=? WHERE id=?',[role,userId]);await fails(()=>ops.state(license,unique),403);}
for(const role of ['department_command','staff','admin','management','owner']){await db.query('UPDATE users SET role=? WHERE id=?',[role,userId]);const data=await ops.state(license,unique);assert(data.can_manage);assert.equal(data.can_review,['admin','management','owner'].includes(role));}
await fails(()=>ops.actor('license:unlinked'),403);
const [dep]=await db.query('INSERT INTO departments(name,slug) VALUES(?,?)',['Temporary department',unique]);departmentId=dep.insertId;
await db.query('UPDATE users SET department_id=? WHERE id=?',[departmentId,userId]);
for(const role of ['recruit','member','reviewer']){await db.query('UPDATE users SET role=? WHERE id=?',[role,userId]);assert(!(await ops.state(license,unique)).can_manage);await fails(()=>ops.action(license,unique,{action:'createCall',title:'Forbidden',priority:'P3'}),403);}
await db.query("UPDATE users SET role='staff' WHERE id=?",[userId]);await fails(()=>ops.action(license,unique,{action:'reportStatus',report_id:1,status:'closed'}),403);
await db.query('UPDATE users SET is_active=0 WHERE id=?',[userId]);await fails(()=>ops.state(license,unique),403);await db.query("UPDATE users SET role='admin',is_active=1 WHERE id=?",[userId]);
await db.query("INSERT INTO fivem_active_units(server_id,user_id,fivem_license,duty_status,position_x,position_y) VALUES(?,?,?,'on_duty',0,1)",[serverId,userId,license]);assert.equal((await ops.state(license,unique)).units[0].position_x,0);
await db.query("UPDATE site_settings SET setting_value='0' WHERE setting_key='tablet_dispatch_enabled'");assert.equal((await ops.state(license,unique)).calls.length,0);await fails(()=>ops.action(license,unique,{action:'panic'}),403);await db.query("UPDATE site_settings SET setting_value='1' WHERE setting_key='tablet_dispatch_enabled'");
await db.query("UPDATE site_settings SET setting_value='0' WHERE setting_key='tablet_cad_enabled'");await fails(()=>ops.search(license,'test'),403);await db.query("UPDATE site_settings SET setting_value='1' WHERE setting_key='tablet_cad_enabled'");
const created=await ops.action(userId,unique,{action:'createCall',title:unique,priority:'P2',position_x:0,position_y:1});const callId=created.call_id;
await fails(()=>ops.action(userId,unique+'_other',{action:'closeCall',call_id:callId}),404);
await ops.action(license,unique,{action:'respond',call_id:callId,user_id:999999,status:'on_scene'});let data=await ops.state(license,unique);assert.equal(data.assignments.find(a=>a.call_id===callId).user_id,userId);
assert.deepEqual((await ops.action(license,unique,{action:'route',call_id:callId})).waypoint,{x:0,y:1});
await fails(()=>ops.action(license,unique,{action:'createCall',title:'Invalid GPS',priority:'P1',position_x:1}),400);
const panic=await Promise.all([ops.action(license,unique,{action:'panic'}),ops.action(license,unique,{action:'panic'})]);assert.equal(panic[0].call_id,panic[1].call_id);
await db.query("UPDATE site_settings SET setting_value='0' WHERE setting_key='tablet_panic_enabled'");await fails(()=>ops.action(license,unique,{action:'panic'}),403);await db.query("UPDATE site_settings SET setting_value='1' WHERE setting_key='tablet_panic_enabled'");
await ops.action(license,unique,{action:'createPerson',name:unique,license_status:'valid'});const [[person]]=await db.query('SELECT id FROM cad_people WHERE name=?',[unique]);personId=person.id;
await ops.action(license,unique,{action:'createVehicle',plate:unique.slice(-16),model:unique,owner_id:personId});const [[vehicle]]=await db.query('SELECT id FROM cad_vehicles WHERE owner_id=?',[personId]);vehicleId=vehicle.id;
await ops.action(license,unique,{action:'createBolo',title:unique,description:'Synthetic test',person_id:personId,vehicle_id:vehicleId});const [[bolo]]=await db.query('SELECT id FROM cad_bolos WHERE person_id=?',[personId]);boloId=bolo.id;
const lookup=await ops.search(license,unique);assert(lookup.people.some(p=>p.id===personId));assert(lookup.vehicles.some(v=>v.id===vehicleId));
await ops.action(license,unique,{action:'closeBolo',bolo_id:boloId});await ops.action(license,unique,{action:'closeCall',call_id:callId});data=await ops.state(license,unique);assert.equal(data.calls.find(c=>c.id===callId).status,'closed');assert(data.events.some(e=>e.event==='closeCall'));
await db.query("UPDATE users SET role='member' WHERE id=?",[userId]);await fails(()=>ops.action(license,unique,{action:'createPerson',name:'Forbidden'}),403);
const [f]=await db.query('INSERT INTO application_forms(title,slug,is_open,cooldown_days) VALUES(?,?,1,1)',['Temporary application',unique]);formId=f.insertId;
const [q]=await db.query("INSERT INTO application_questions(form_id,label,question_type,is_required,options_json) VALUES(?,'Select options','checkbox',1,?)",[formId,JSON.stringify(['A','B'])]);const qkey='q_'+q.insertId;
assert((await apps.catalog(license)).forms.some(f=>f.id===formId));assert.equal((await apps.form(license,formId)).questions.length,1);
membership=false;await fails(()=>apps.submit(license,{slug:unique,answers:{[qkey]:['A']}}),403);membership='unavailable';await fails(()=>apps.submit(license,{slug:unique,answers:{[qkey]:['A']}}),503);membership=true;
await fails(()=>apps.submit(license,{slug:unique,answers:{}}),400);await fails(()=>apps.submit(license,{slug:unique,answers:{[qkey]:['Injected']}}),400);
const request_key='submission_'+Date.now();const submitted=await Promise.all([apps.submit(license,{slug:unique,answers:{[qkey]:['A','B']},request_key}),apps.submit(license,{slug:unique,answers:{[qkey]:['A','B']},request_key})]);assert.equal(submitted[0].application_id,submitted[1].application_id);
const [[answer]]=await db.query('SELECT answer_text FROM application_answers WHERE application_id=?',[submitted[0].application_id]);assert.equal(answer.answer_text,'A, B');await fails(()=>apps.submitUser(userId,unique,{[qkey]:['A']}),409);
await db.query("UPDATE site_settings SET setting_value='0' WHERE setting_key='tablet_applications_enabled'");await fails(()=>apps.catalog(license),403);await fails(()=>apps.form(license,formId),403);await fails(()=>apps.submit(license,{slug:unique,answers:{[qkey]:['A']}}),403);
await db.query('UPDATE application_forms SET cooldown_days=0 WHERE id=?',[formId]);assert((await apps.submitUser(userId,unique,{[qkey]:['A']})).ok,'tablet switch must not disable web applications');
await db.query('UPDATE application_forms SET is_open=0 WHERE id=?',[formId]);await fails(()=>apps.submitUser(userId,unique,{[qkey]:['A']}),404);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8ZsAAAAASUVORK5CYII=','base64');assert.equal(branding.imageType(png),'image/png');assert.equal(branding.imageType(Buffer.from('<svg></svg>')),null);
await db.query('UPDATE community_branding SET file_data=?,mime_type=? WHERE id=1',[png,'image/png']);const brand=await branding.load();assert.equal(brand.logo,'data:image/png;base64,'+png.toString('base64'));assert.equal(brand.features.applications,false);
console.log('Passed real SQL: role matrix, server boundaries, trusted actor, concurrent panic deduplication, CAD/BOLO lifecycle, call audit, feature gates, Discord failures, required answers, concurrent submission retry, cooldown, closed forms and SQL logo round trip.');
})().catch(e=>{console.error('Operations integration failed:',e.code||e.message);process.exitCode=1;}).finally(async()=>{
if(oldFlags)for(const flag of oldFlags)await db.query('UPDATE site_settings SET setting_value=? WHERE setting_key=?',[flag.setting_value,flag.setting_key]);if(oldLogo)await db.query('UPDATE community_branding SET file_data=?,mime_type=?,sha256=? WHERE id=1',[oldLogo.file_data,oldLogo.mime_type,oldLogo.sha256]);
if(boloId)await db.query('DELETE FROM cad_bolos WHERE id=?',[boloId]);if(vehicleId)await db.query('DELETE FROM cad_vehicles WHERE id=?',[vehicleId]);if(personId)await db.query('DELETE FROM cad_people WHERE id=?',[personId]);if(serverId)await db.query('DELETE FROM fivem_calls WHERE server_id=?',[serverId]);if(formId){await db.query('DELETE FROM applications WHERE form_id=?',[formId]);await db.query('DELETE FROM application_forms WHERE id=?',[formId]);}if(userId)await db.query('DELETE FROM users WHERE id=?',[userId]);if(serverId)await db.query('DELETE FROM fivem_servers WHERE id=?',[serverId]);if(server2)await db.query('DELETE FROM fivem_servers WHERE id=?',[server2]);if(departmentId)await db.query('DELETE FROM departments WHERE id=?',[departmentId]);await db.end();});
