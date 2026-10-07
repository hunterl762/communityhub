const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ejs=require('ejs');
const auth=require(path.join(root,'src/middleware/auth'));
const roles=['applicant','recruit','member','reviewer','department_command','staff','admin','management','owner'];
const base={communityName:'Community <Hub>',cookieAccepted:true,unreadNotifications:3,currentPath:'/admin/fivem'};
const render=(p,data)=>ejs.render(fs.readFileSync(path.join(root,p),'utf8'),{...base,...data},{filename:path.join(root,p)});
for(const role of [null,...roles]){
 const user=role?{id:1,role,display_name:'Test <User>'}:null;
 const html=render('views/partials/header.ejs',{user});
 assert.equal(html.includes('href="/admin/fivem"'),['admin','management','owner'].includes(role));
 assert.equal(html.includes('href="/admin/users"'),['admin','owner'].includes(role));
 assert.equal(html.includes('href="/admin/management/notifications"'),auth.STAFF_ROLES.includes(role));
 assert.equal(html.includes('href="/admin"'),auth.REVIEW_ROLES.includes(role));
 assert.equal(html.includes('action="/auth/logout"'),!!role);
 if(role)assert(html.includes('Test &lt;User&gt;'));
 for(const allowed of [auth.REVIEW_ROLES,auth.STAFF_ROLES,['admin','management','owner'],auth.USER_MANAGER_ROLES]){
  let outcome;
  auth.requireRoles(allowed)({session:{user}},{redirect:()=>outcome='login',status:()=>({render:()=>outcome='denied'})},()=>outcome='allowed');
  assert.equal(outcome,!role?'login':allowed.includes(role)?'allowed':'denied');
 }
 if(auth.REVIEW_ROLES.includes(role)){
  const dashboard=render('views/admin/index.ejs',{user,canManageUsers:auth.USER_MANAGER_ROLES.includes(role),isOwner:role==='owner',appStats:{pending:2},reportStats:{},applications:[],reports:[]});
  assert(dashboard.includes('<section class="panel"><h2>Application Reviews'));
  assert.equal(dashboard.includes('id="community-settings"'),role==='owner');
  assert.equal((dashboard.match(/<section\b/g)||[]).length,(dashboard.match(/<\/section>/g)||[]).length);
 }
}
for(const serverCount of [0,2]){
 const data={user:{id:1,role:'admin'},stats:{patrols:4,patrol_minutes:120,unique_members:2},servers:Array.from({length:serverCount},(_,i)=>({id:i+1,name:'Test <Server>',server_key:'primary',framework:i?'qbcore':'standalone',max_players:64,is_enabled:i?0:1,current_players:3,last_heartbeat_at:i?null:new Date()})),keys:[{id:1,name:'Test <Key>',key_prefix:'ch_fivem_123',server_name:null,is_active:1,created_at:new Date(),last_used_at:null},{id:2,name:'Revoked',key_prefix:'ch_fivem_456',is_active:0,created_at:new Date()}],announcements:[{title:'Hello <MDT>',message:'Test',priority:'info',is_active:1}],newApiKey:'ch_fivem_test'};
 const html=render('views/admin/fivem.ejs',data);
 assert(html.includes('ch_fivem_test'));assert(html.includes('Test &lt;Key&gt;'));assert(html.includes('Never'));
 assert.equal((html.match(/action="\/admin\/fivem\/servers\//g)||[]).length,serverCount);
 if(serverCount)assert(html.includes('selected>QBCore'));
 assert.equal((html.match(/<section\b/g)||[]).length,(html.match(/<\/section>/g)||[]).length);
}
function compile(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())compile(p);else if(p.endsWith('.ejs'))ejs.compile(fs.readFileSync(p,'utf8'),{filename:p});}}
compile(path.join(root,'views'));
console.log('Passed: navigation for guests and all nine roles, authorization matrix, dashboard structure/owner settings, FiveM populated/empty states, escaping and all template compilation.');
