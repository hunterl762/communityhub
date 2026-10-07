const assert = require('node:assert/strict');
const path = require('node:path');
const dbPath = require.resolve('../src/db');
let role = 'member', active = null, inserted = 0, events = [], queries = [], historyQueries = [];
const conn = {
  async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
  async query(sql, args) {
    queries.push(sql);
    if(sql.includes('fivem_license')) return [[role ? {id:1,role} : undefined]];
    if(sql.includes('FROM users')) return [[{id:1,department_id:2,callsign:'A1'}]];
    if(sql.includes("status='active'") && sql.startsWith('SELECT')) return [[active]];
    if(sql.includes('FROM fivem_servers')) return [[{id:3}]];
    if(sql.includes('COUNT(*)')) return [[{count:0}]];
    if(sql.startsWith('INSERT INTO patrol_sessions')) { active={id:++inserted};return [{insertId:inserted}]; }
    if(sql.startsWith('UPDATE patrol_sessions')) active=null;
    if(sql.startsWith('INSERT INTO patrol_clock_events')) events.push(args);
    if(sql.includes('SELECT c.id')) return [[{id:1,message:'Hello'}]];
    return [{}];
  }
};
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{getConnection:async()=>conn,query:async(sql,args)=>{historyQueries.push({sql,args});return [[]];}}};
const chat=require('../src/services/adminChat'),clock=require('../src/services/patrolClock');
(async()=>{
  for(role of [null,'applicant','member','reviewer','department_command','staff']){
    queries=[];assert.equal((await chat.handle('license:test','primary')).status,403);
    assert.equal((await chat.handle('license:test','primary','Secret')).status,403);
    assert(!queries.some(q=>q.includes('fivem_admin_chat')),'unauthorized actor accessed chat storage');
  }
  for(role of ['admin','management','owner']) assert((await chat.handle('license:test','primary','Hello')).ok);
  assert.equal((await chat.handle('license:test','primary',' ')).status,400);
  assert.equal((await chat.handle('license:test','primary','x'.repeat(1001))).status,400);
  role='member';assert.equal((await chat.handle('license:test','primary')).status,403,'demoted role retained chat access');
  await clock.change(1,'in','web','primary');
  assert((await clock.change(1,'in','game','primary')).already_active);
  assert.equal(inserted,1);assert.equal(events.length,1);
  await clock.change(1,'out','game','primary');
  assert((await clock.change(1,'out','web','primary')).already_clocked_out);
  assert.equal(events.length,2);assert.equal(events[0][3],'web');assert.equal(events[1][3],'game');
  await clock.history(1);
  assert(historyQueries.every(q=>q.sql.includes('WHERE')&&q.args[0]===1),'member history was not scoped to the actor');
  console.log('Passed: chat role authorization/demotion, message validation, idempotent patrol actions, source audit and private history.');
})().catch(error=>{console.error(error);process.exitCode=1;});
