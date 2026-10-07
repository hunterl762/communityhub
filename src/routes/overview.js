const router=require('express').Router();
const {requireAuth}=require('../middleware/auth');
const overview=require('../services/overview');
router.use(requireAuth);
router.get('/',async(req,res,next)=>{try{res.render('overview/index',{overview:await overview.load(req.session.user)});}catch(e){next(e);}});
router.get('/updates',async(req,res,next)=>{try{res.set('Cache-Control','no-store');res.render('overview/content',{overview:await overview.load(req.session.user)});}catch(e){next(e);}});
module.exports=router;
