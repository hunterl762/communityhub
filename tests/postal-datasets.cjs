const assert=require('node:assert/strict'),path=require('path'),{execFileSync}=require('child_process');
for(const [dataset,file,count] of [['badger','badger-postals.json',865],['ocrp','ocrp-postals.json',865],['new','postals.json',1687]]){
 const rows=require('../public/data/'+file);assert.deepEqual(rows,require('../fivem/communityhub/html/data/'+file));
 const result=execFileSync(process.execPath,['-e',`const assert=require('node:assert/strict'),p=require('./src/services/postals'),rows=require('./public/data/${file}');assert.equal(p.count,${count});for(const row of rows){assert.equal(p.nearest(row.x,row.y).distance,0);assert.equal(p.byCode(row.code).x,row.x);assert.equal(p.byCode(row.code).y,row.y);}assert.equal(p.nearest(NaN,0),null);assert.equal(p.nearest(20001,0),null);console.log(p.dataset);`],{cwd:path.resolve(__dirname,'..'),env:{...process.env,POSTAL_DATASET:dataset},encoding:'utf8'});assert.equal(result.trim(),dataset);
}
console.log('Passed: Badger/OCRP/new dataset selection, matching client/server data, every postal center and invalid coordinates.');
