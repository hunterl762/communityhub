const assert=require('node:assert/strict'),path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'..');
const dbPath=require.resolve('../src/db');
const inserted=[];let rolledBack=false,packet=64000000,role='staff',download;
const connection={query:async(sql,args)=>{
 if(sql.includes('max_allowed_packet'))return [[{packet_size:packet}]];
 inserted.push({sql,args});return [{insertId:77}];
},beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{rolledBack=true;},release(){}};
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{getConnection:async()=>connection,query:async()=>[[download]]}};
const status=require('../src/services/fivemStatus');
const now=new Date('2026-10-04T12:00:00Z');
const old=new Date(now-100000),fresh=new Date(now-10000);
assert.equal(status.liveAt(fresh,now),true);assert.equal(status.liveAt(new Date(now-90000),now),false);
assert.deepEqual(status.nextPeriods(null,null,now,false),[{state:'offline',at:now}]);
assert.deepEqual(status.nextPeriods(null,null,now,true),[{state:'online',at:now}]);
assert.deepEqual(status.nextPeriods({state:'online',started_at:new Date(now-200000)},fresh,now,true),[]);
const recovered=status.nextPeriods({state:'online',started_at:new Date(now-200000)},old,now,true);
assert.deepEqual(recovered,[{state:'offline',at:new Date(old.getTime()+90000)},{state:'online',at:now}]);
assert.deepEqual(status.nextPeriods({state:'offline',started_at:old},null,now,false),[]);
assert.deepEqual(status.nextPeriods({state:'offline',started_at:old},old,now,true),[{state:'online',at:now}]);
assert.equal(status.nextPeriods({state:'online',started_at:new Date(now-5000)},old,now,false)[0].at.getTime(),now-5000);
const express=require('express');const app=express();app.set('view engine','ejs');app.set('views',path.join(root,'views'));
app.use((req,res,next)=>{req.session={user:{id:1,role}};Object.assign(res.locals,{communityName:'Test',user:req.session.user,currentPath:req.path,unreadNotifications:0,cookieAccepted:true});next();});
app.use('/documents',require('../src/routes/documents'));
app.use((error,req,res,next)=>res.status(500).json({error:error.message}));
const server=app.listen(0,'127.0.0.1');
(async()=>{
 await new Promise(resolve=>server.on('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
 const bytes=Buffer.from('Database file contents');
 const form=()=>{const f=new FormData();f.append('document',new Blob([bytes],{type:'text/plain'}),'guide.txt');f.append('title','Test guide');return f;};
 let response=await fetch(base+'/documents/upload',{method:'POST',body:form(),redirect:'manual'});
 assert.equal(response.status,302);const stored=inserted.find(q=>q.sql.includes('INSERT INTO document_contents'));assert(stored.args[1].equals(bytes));assert.equal(stored.args[2],require('crypto').createHash('sha256').update(bytes).digest('hex'));
 const before=inserted.length;role='member';response=await fetch(base+'/documents/upload',{method:'POST',body:form(),redirect:'manual'});assert.equal(response.status,403);assert.equal(inserted.length,before);
 role='staff';packet=1;response=await fetch(base+'/documents/upload',{method:'POST',body:form()});assert.equal(response.status,413);assert.equal(inserted.length,before);
 packet=64000000;download={original_name:'guide.txt',stored_name:'ignored',mime_type:'text/plain',file_data:bytes};response=await fetch(base+'/documents/77/download');assert.equal(response.status,200);assert(Buffer.from(await response.arrayBuffer()).equals(bytes));assert.match(response.headers.get('content-disposition'),/attachment/);
 const ejs=require('ejs');
 for(const role of ['staff','admin','management','owner']){
 const html=ejs.render(fs.readFileSync(path.join(root,'views/admin/management.ejs'),'utf8'),{user:{role},communityName:'Test',currentPath:'/admin/management',cookieAccepted:true,unreadNotifications:0,departments:[],loa:[],certs:[],audit:[]},{filename:path.join(root,'views/admin/management.ejs')});
 assert.equal(html.includes('action="/admin/management/departments"'),['admin','management','owner'].includes(role));
 }
 console.log('Passed: outage thresholds/recovery/gap logic, SQL document bytes/checksum/download, packet limits, upload roles and management controls.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
