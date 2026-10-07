const router=require('express').Router(),crypto=require('crypto');
const {rateLimit}=require('express-rate-limit');
const content=require('../services/communityContent'),support=require('../services/support');
const {requireAuth}=require('../middleware/auth');
const csrfToken=req=>req.session.communityFormToken||(req.session.communityFormToken=crypto.randomBytes(32).toString('hex'));
const action=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).render('message',{title:'CommunityHub',message:e.message});next(e);}};
async function requireStaff(req,res,next){try{const user=await content.actor(req.session.user.id);if(!user.staff)content.fail('Support staff access required.',403);next();}catch(e){if(e.status)return res.status(e.status).render('message',{title:'Access denied',message:e.message});next(e);}}
function csrf(req,res,next){const a=Buffer.from(String(req.body._csrf||'')),b=Buffer.from(req.session.communityFormToken||'');if(!b.length||a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(403).render('message',{title:'Session expired',message:'Reload this page before submitting your changes.'});next();}
const throttle=rateLimit({windowMs:15*60*1000,limit:30,keyGenerator:req=>String(req.session.user.id),message:'Too many submissions. Please try again later.'});
router.use(['/support','/community/manage'],(req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/news',action(async(req,res)=>res.render('community/news',{...await content.news(req.query.q||'',req.query.category||''),staff:content.STAFF.includes(req.session.user?.role)})));
router.get('/news/:id',action(async(req,res)=>res.render('community/post',{post:await content.post(req.params.id)})));
router.get('/rules',action(async(req,res)=>res.render('community/rules',{...await content.rules(req.query.q||''),staff:content.STAFF.includes(req.session.user?.role)})));
router.get('/community/manage',requireAuth,requireStaff,action(async(req,res)=>res.render('community/manage',{...await content.news('','',true),...await content.rules('',true)})));
router.get('/community/manage/:kind/:id',requireAuth,requireStaff,action(async(req,res)=>{
 if(!['news','rules'].includes(req.params.kind))content.fail('Page not found.',404);
 const item=req.params.id==='new'?{title:'',category:req.params.kind==='news'?'News':'General',body:'',summary:'',tags:'',sort_order:0,status:'draft'}:req.params.kind==='news'?await content.post(req.params.id,true):await content.rule(req.params.id);
 res.render('community/editor',{kind:req.params.kind,item,recordId:req.params.id,csrf:csrfToken(req)});
}));
router.post('/community/manage/:kind/:id',requireAuth,requireStaff,csrf,throttle,action(async(req,res)=>{await content.save(req.params.kind,req.params.id,req.session.user.id,req.body);res.redirect('/community/manage');}));
router.get('/support',requireAuth,action(async(req,res)=>res.render('community/support',{...await support.list(req.session.user.id,req.query.queue==='1',req.query.status||''),statuses:support.STATUSES})));
router.get('/support/new',requireAuth,action(async(req,res)=>{await content.actor(req.session.user.id);res.render('community/ticket-new',{csrf:csrfToken(req)});}));
router.post('/support',requireAuth,csrf,throttle,action(async(req,res)=>res.redirect('/support/tickets/'+await support.create(req.session.user.id,req.body))));
router.get('/support/tickets/:id',requireAuth,action(async(req,res)=>res.render('community/ticket',{...await support.thread(req.session.user.id,req.params.id),statuses:support.STATUSES,csrf:csrfToken(req)})));
router.post('/support/tickets/:id/reply',requireAuth,csrf,throttle,action(async(req,res)=>{await support.update(req.session.user.id,req.params.id,req.body);res.redirect('/support/tickets/'+req.params.id);}));
router.post('/support/tickets/:id/status',requireAuth,csrf,throttle,action(async(req,res)=>{await support.update(req.session.user.id,req.params.id,req.body,true);res.redirect('/support/tickets/'+req.params.id);}));
module.exports=router;
