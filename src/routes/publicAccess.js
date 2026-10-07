const router=require('express').Router();
const db=require('../db');
const {membership}=require('../middleware/communityMember');
const action=fn=>async(req,res,next)=>{try{await fn(req,res,next);}catch(e){next(e);}};
// Members retain their personal workspace; everyone else sees only public fields.
const publicVisitor=async(req,res,next)=>{
  if(req.session.user){
    try{if(await membership(req))return next('route');}catch{}
  }
  next();
};
router.get(['/overview','/overview/updates','/fivem'],publicVisitor,action(async(req,res)=>{
  const [servers]=await db.query("SELECT name,max_players,IF(last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),1,0) live,IF(last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),current_players,0) current_players FROM fivem_servers WHERE is_enabled=1 ORDER BY id");
  res.render('public/operations',{servers});
}));
router.get(['/fivem/status','/fivem/status/data'],action(async(req,res)=>{
  const snapshot=await require('../services/fivemStatus').snapshot();
  res.set('Cache-Control','no-store');
  if(req.path.endsWith('/data'))return res.json({ok:true,...snapshot});
  res.render('fivem/status',{snapshot,duration:seconds=>{const minutes=Math.floor(Number(seconds||0)/60);return Math.floor(minutes/60)+'h '+minutes%60+'m';}});
}));
router.get(['/personnel','/personnel/:id'],publicVisitor,action(async(req,res,next)=>{
  if(req.params.id&&!/^\d+$/.test(req.params.id))return next();
  const params=req.params.id?[req.params.id]:[];
  const [members]=await db.query("SELECT u.id,u.display_name,u.callsign,u.rank_name,d.name department_name FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.is_active=1 AND u.member_status IN('recruit','active','loa','inactive')"+(req.params.id?' AND u.id=?':'')+' ORDER BY d.name,u.rank_name,u.display_name',params);
  if(req.params.id&&!members.length)return next();
  res.render('public/directory',{members,profile:!!req.params.id});
}));
router.get('/applications', (req,res,next)=>req.session.user?next('route'):next(),action(async(req,res)=>{
  const [forms]=await db.query('SELECT title,slug,description FROM application_forms WHERE is_open=1 ORDER BY sort_order,title');
  res.render('applications/index',{forms});
}));
router.get('/applications/:slug',(req,res,next)=>req.session.user?next('route'):next(),action(async(req,res,next)=>{
  const [[form]]=await db.query('SELECT id,title,description FROM application_forms WHERE slug=? AND is_open=1',[req.params.slug]);
  if(!form)return next();
  const [questions]=await db.query('SELECT label,help_text,is_required FROM application_questions WHERE form_id=? ORDER BY sort_order,id',[form.id]);
  res.render('public/application',{form,questions});
}));
router.get(['/reports','/support'],(req,res,next)=>req.session.user?next('route'):next(),(req,res)=>{
  const reports=req.path==='/reports';
  res.render('public/service',{title:reports?'Community reports':'Community support',description:reports?'Send a player, staff or bug report to the community team for review.':'Contact the community team for help with your account, applications or community questions.',action:reports?'Sign in to submit a report':'Sign in to open a ticket'});
});
module.exports=router;
