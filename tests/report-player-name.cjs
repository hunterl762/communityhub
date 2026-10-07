const assert=require('node:assert/strict'),db=require('../src/db');
let saved,committed=false,rolledBack=false;
const conn={beginTransaction:async()=>{},commit:async()=>{committed=true},rollback:async()=>{rolledBack=true},release(){},query:async(sql,params)=>{
 if(sql.startsWith('SELECT id FROM fivem_servers'))return [[{id:1}]];
 if(sql.includes('FROM users'))return [[{id:7,is_active:1,role:'admin'}]];
 if(sql.startsWith('INSERT INTO fivem_reports'))return [{insertId:11}];
 if(sql.startsWith('SELECT id FROM reports'))return [[]];
 if(sql.includes('SELECT f.*'))return [[{id:11,subject:'Test report',details:'Details',reporter_user_id:7,report_type:'Player Report',status:'open',created_at:new Date()}]];
 if(sql.startsWith('INSERT INTO reports'))return [{insertId:42}];
 if(sql.startsWith('UPDATE reports SET reported_name')){saved=params;return [{affectedRows:1}];}
 if(sql.includes('FROM fivem_reports r'))return [[{id:11,reported_name:saved[0]}]];
 throw Error(sql);
}};
db.getConnection=async()=>conn;db.query=conn.query;
(async()=>{const sync=require('../src/services/reportSync');const result=await sync.submit({license:'license:fixture',server_key:'primary',report_type:'player',subject:'Test',details:'Details',reported_name:'  Reported Player  '});assert.equal(result.website_report_id,42);assert.deepEqual(saved,['Reported Player',42]);assert(committed);assert(!rolledBack);const queue=await require('../src/services/gameReports').read('license:fixture','primary');assert.equal(queue.reports[0].reported_name,'Reported Player');await assert.rejects(sync.submit({reported_name:'x'.repeat(151)}),e=>e.status===400);console.log('Passed reported-player validation, atomic website storage and in-game review projection.');await db.end();})().catch(e=>{console.error(e);process.exitCode=1});
