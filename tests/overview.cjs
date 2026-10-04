const assert=require('node:assert/strict'),path=require('path'),fs=require('fs');const root=path.resolve(__dirname,'..');
const calls=[];const database={async query(sql,args){calls.push({sql,args});if(sql.includes('FROM fivem_servers'))return [[{name:'Online',live:1,current_players:8},{name:'Offline',live:0,current_players:99}]];if(sql.includes('SELECT (SELECT COUNT'))return [[{applications:717,reports:919}]];if(sql.includes('FROM applications a'))return [[{id:1,status:'submitted',title:'<script>alert(1)</script>'}]];return [[]];}};
const dbPath=require.resolve('../src/db');require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:database};
const overview=require('../src/services/overview');const ejs=require('ejs'),express=require('express');const {REVIEW_ROLES}=require('../src/middleware/auth');
(async()=>{
  for(const role of ['applicant','recruit','member','reviewer','department_command','staff','admin','management','owner']){
    calls.length=0;const data=await overview.load({id:42,role});assert.equal(data.players,8,'offline server players counted');assert.equal(data.online,1);
    assert.equal(!!data.review,REVIEW_ROLES.includes(role));assert.equal(calls.some(c=>c.sql.includes('SELECT (SELECT COUNT')),REVIEW_ROLES.includes(role));
    for(const call of calls.filter(c=>c.sql.includes('FROM applications a')||c.sql.includes('FROM patrol_sessions p')))assert.equal(call.args[0],42,'personal data not scoped');
    const units=calls.find(c=>c.sql.includes('FROM fivem_active_units'));assert(units.sql.includes('a.last_seen_at>')&&units.sql.includes('s.last_heartbeat_at>'));assert(!units.sql.includes('fivem_license'));
    const html=ejs.render(fs.readFileSync(path.join(root,'views/overview/content.ejs'),'utf8'),{overview:data},{filename:path.join(root,'views/overview/content.ejs')});assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>alert'));
  }
  const app=express();app.set('views',path.join(root,'views'));app.set('view engine','ejs');app.use((req,res,next)=>{req.session={user:req.get('x-test-role')?{id:42,role:req.get('x-test-role')}:null};Object.assign(res.locals,{user:req.session.user,communityName:'Test Hub',cookieAccepted:true,unreadNotifications:0,currentPath:req.path});next();});app.use('/overview',require('../src/routes/overview'));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));try{const base='http://127.0.0.1:'+server.address().port;
    for(const endpoint of ['/overview','/overview/updates']){const res=await fetch(base+endpoint,{redirect:'manual'});assert.equal(res.status,302);assert.equal(res.headers.get('location'),'/auth/login');}
    const member=await fetch(base+'/overview/updates',{headers:{'x-test-role':'member'}});assert.equal(member.status,200);assert.equal(member.headers.get('cache-control'),'no-store');assert(!(await member.text()).includes('Staff review queue'));
    const admin=await fetch(base+'/overview',{headers:{'x-test-role':'admin'}});assert.equal(admin.status,200);assert((await admin.text()).includes('717 submitted applications'));
  }finally{await new Promise(resolve=>server.close(resolve));}
  console.log('Passed: Overview authentication, own-data isolation, role-gated review queries, stale-unit filtering, offline totals, escaping and uncached updates.');
})().catch(error=>{console.error(error);process.exitCode=1;});
