const lookup=require('../../public/js/postals'),rows=lookup.normalize(require('../../public/data/postals.json'));
module.exports={nearest:(x,y)=>lookup.nearest(rows,x,y),byCode:code=>lookup.byCode(rows,code),count:rows.length};
