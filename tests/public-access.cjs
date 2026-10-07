const assert=require('node:assert/strict'),express=require('express'),path=require('path');
const db=require('../src/db'),discord=require('../src/services/discord'),status=require('../src/services/fivemStatus');
let active=true,joined=true,unavailable=false;
const queries=[];
db.query=async(sql)=>{queries.push(sql);if(sql.includes('SELECT discord_id,is_active'))return [[{discord_id:'123',is_active:active}]];
  if(sql.includes('FROM fivem_servers'))return [[{name:'Public server',live:1,current_players:4,max_players:64}]];
  if(sql.includes('FROM users u'))return [[{id:1,display_name:'Public member',callsign:'101',rank_name:'Member',department_name:'Community'}]];
  if(sql.includes('FROM application_questions'))return [[{label:'Why would you like to join?',is_required:1}]];
  if(sql.includes('FROM application_forms'))return [[{id:1,title:'Recruitment',slug:'recruitment',description:'Join the community'}]];
  throw Error('Unexpected query: '+sql);
};
discord.isGuildMember=async()=>{if(unavailable)throw Error('Discord unavailable');return joined;};
status.snapshot=async()=>({servers:[],history:[],updatedAt:new Date().toISOString(),refreshSeconds:15});
const {requireCommunityMember}=require('../src/middleware/communityMember');
async function run(){const app=express();app.set('views',path.resolve(__dirname,'../views'));app.set('view engine','ejs');
  app.use((req,res,next)=>{req.session={user:req.get('x-test-user')?{id:1,role:'member',display_name:'Member'}:null};Object.assign(res.locals,{communityName:'CommunityHub',user:req.session.user,currentPath:req.path,cookieAccepted:true,unreadNotifications:0});next();});
  app.use(require('../src/routes/publicAccess'));
  app.use(['/admin','/community/manage','/command-center','/staff-activity','/loa-management','/documents','/training','/lms','/calendar','/personnel'],requireCommunityMember);
  app.use(['/reports','/support','/applications','/fivem'],require('../src/middleware/auth').requireAuth);
  app.use((req,res)=>res.send('Protected route reached'));
  const listener=app.listen(0,'127.0.0.1');await new Promise(r=>listener.once('listening',r));const url='http://127.0.0.1:'+listener.address().port;
  try{
    for(const route of ['/overview','/fivem','/fivem/status','/fivem/status/data','/personnel','/personnel/1','/applications','/applications/recruitment','/support','/reports']){
      const r=await fetch(url+route,{redirect:'manual'});assert.equal(r.status,200,route);const body=await r.text();assert(!body.includes('Protected route reached'));assert(!body.includes('data-duty-seconds'));assert(!body.includes('name="message"'));
    }
    assert(queries.every(q=>!q.includes('disciplinary_records')&&!q.includes('training_registrations')&&!q.includes('support_messages')&&!q.includes('email')));
    for(const route of ['/reports','/support','/applications/recruitment','/fivem/clock-in']){
      const r=await fetch(url+route,{method:'POST',redirect:'manual'});assert.equal(r.status,302,route);assert.equal(r.headers.get('location'),'/auth/login');
    }
    const privateTicket=await fetch(url+'/support/tickets/1',{redirect:'manual'});assert.equal(privateTicket.status,302);
    for(const route of ['/documents','/documents/1/download','/calendar','/calendar/api/events','/training','/lms','/lms/courses/1','/lms/admin','/admin','/community/manage','/personnel/me/loa']){
      let r=await fetch(url+route,{redirect:'manual'});assert.equal(r.status,302,route);assert.equal(r.headers.get('location'),'/auth/login');
      joined=false;r=await fetch(url+route,{headers:{'x-test-user':'1'}});assert.equal(r.status,403,route);
      joined=true;r=await fetch(url+route,{headers:{'x-test-user':'1'}});assert.equal(r.status,200,route);assert.equal(await r.text(),'Protected route reached');
    }
    active=false;let r=await fetch(url+'/documents',{headers:{'x-test-user':'1'}});assert.equal(r.status,403);active=true;
    unavailable=true;r=await fetch(url+'/calendar',{headers:{'x-test-user':'1'}});assert.equal(r.status,503);assert(!String(await r.text()).includes('Protected route reached'));
    r=await fetch(url+'/overview',{headers:{'x-test-user':'1'}});assert.equal(r.status,200);assert((await r.text()).includes('Community overview'));
    console.log('Passed public views, safe field selection, guest/member/nonmember gates, document/calendar endpoints, disabled accounts and Discord outage denial.');
  }finally{await new Promise(r=>listener.close(r));await db.end();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
