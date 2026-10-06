const lookup=require('../../public/js/postals');
const dataset=process.env.POSTAL_DATASET||'ocrp';
if(!['ocrp','new'].includes(dataset))throw new Error('POSTAL_DATASET must be ocrp or new');
const rows=lookup.normalize(require(dataset==='ocrp'?'../../public/data/ocrp-postals.json':'../../public/data/postals.json'));
module.exports={nearest:(x,y)=>lookup.nearest(rows,x,y),byCode:code=>lookup.byCode(rows,code),count:rows.length,dataset};
