// Shared lookup rules for API records and browser previews. Dataset is bundled locally.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CommunityPostals=factory();})(typeof window!=='undefined'?window:this,function(){
function normalize(rows){if(!Array.isArray(rows))return [];const seen=new Set();return rows.filter(p=>p&&typeof p.code==='string'&&p.code.length<=16&&/^[a-zA-Z0-9_-]+$/.test(p.code)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=20000&&Math.abs(p.y)<=20000&&!seen.has(p.code)&&seen.add(p.code)).map(p=>({code:p.code,x:p.x,y:p.y}));}
function nearest(rows,x,y){if(typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>20000||Math.abs(y)>20000)return null;let best=null,distance=Infinity;for(const p of rows){const d=(p.x-x)**2+(p.y-y)**2;if(d<distance){best=p;distance=d;}}return best?{...best,distance:Math.sqrt(distance)}:null;}
function byCode(rows,code){return rows.find(p=>p.code===String(code||'').trim())||null;}
return {normalize,nearest,byCode};});
