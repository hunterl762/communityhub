const lookup=require('../../public/js/postals');
const dataset=process.env.POSTAL_DATASET||'badger';
if(!['badger','ocrp','new'].includes(dataset))throw new Error('POSTAL_DATASET must be badger, ocrp or new');
const rows=lookup.normalize(require('../../public/data/'+({badger:'badger-postals.json',ocrp:'ocrp-postals.json',new:'postals.json'}[dataset])));
module.exports={nearest:(x,y)=>lookup.nearest(rows,x,y),byCode:code=>lookup.byCode(rows,code),count:rows.length,dataset};
