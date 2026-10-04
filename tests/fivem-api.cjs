const assert=require('node:assert/strict');
const path=require('path');
const express=require('express');
const root=path.resolve(__dirname,'..');
const dbPath=require.resolve('../src/db');
let schemaFailure=false,serverMissing=false;
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{query:async()=>{
  if(schemaFailure)throw Object.assign(new Error('sensitive SQL must not leak'),{code:'ER_NO_SUCH_TABLE'});
  if(serverMissing)return [[]];
  return [[{server_key:'primary',name:'Test server',framework:'standalone'}]];
}}};
const testKey=require('node:crypto').randomBytes(32).toString('hex');
process.env.FIVEM_API_KEY=testKey;
const app=express();
app.use('/api/fivem',express.json(),require('../src/routes/fivemApi'),require('../src/middleware/fivemErrors'));
let siteRequests=0;
app.use((req,res)=>{siteRequests++;res.status(429).send('Website quota');});
const server=app.listen(0,'127.0.0.1');
(async()=>{
  await new Promise(resolve=>server.on('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const get=p=>fetch(base+p,{headers:{'x-communityhub-key':testKey}});
  let response=await fetch(base+'/api/fivem/status/primary');
  assert.equal(response.status,401);assert.equal((await response.json()).ok,false);
  for(let i=0;i<510;i++){
    response=await get('/api/fivem/status/primary');
    assert.equal(response.status,200,'normal telemetry hit the former 500-request website limit');
    assert.equal((await response.json()).ok,true);
  }
  assert.equal(siteRequests,0,'API requests entered website middleware');
  response=await get('/api/fivem/unknown');assert.equal(response.status,404);assert.match((await response.json()).error,/endpoint not found/);
  response=await fetch(base+'/api/fivem/link',{method:'POST',headers:{'x-communityhub-key':testKey,'Content-Type':'application/json'},body:'{bad'});
  assert.equal(response.status,400);assert.equal((await response.json()).error,'Invalid JSON request body');
  response=await fetch(base+'/api/fivem/link',{method:'POST',headers:{'x-communityhub-key':testKey,'Content-Type':'application/json'},body:JSON.stringify({code:'player-id',license:'license:test'})});
  assert.equal(response.status,400);assert.equal((await response.json()).error,'Invalid link request');
  serverMissing=true;
  response=await fetch(base+'/api/fivem/active-unit',{method:'POST',headers:{'x-communityhub-key':testKey,'Content-Type':'application/json'},body:JSON.stringify({server_key:'unknown',license:'license:test'})});
  assert.equal(response.status,404);assert.match((await response.json()).error,/Config.ServerKey/);
  serverMissing=false;
  schemaFailure=true;
  response=await get('/api/fivem/status/primary');assert.equal(response.status,503);
  const body=await response.json();assert.match(body.error,/migrations 005 and 006/);assert(!JSON.stringify(body).includes('sensitive SQL'));
  response=await fetch(base+'/');assert.equal(response.status,429);assert.equal(siteRequests,1);
  const manifest=require('fs').readFileSync(path.join(root,'fivem/communityhub/fxmanifest.lua'),'utf8');
  assert(!manifest.includes('shared_script'));assert(manifest.includes("server_scripts {'config.lua','server/http.lua','server/main.lua'}"));
  console.log('Passed: 510 authenticated requests, preserved auth, API/site isolation, JSON errors, migration guidance and server-only config.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
