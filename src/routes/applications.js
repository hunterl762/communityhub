const router=require('express').Router();const db=require('../db');
const {requireAuth}=require('../middleware/auth');const {isGuildMember}=require('../services/discord');
router.use(requireAuth);
router.get('/',async(req,res)=>{const [forms]=await db.query("SELECT * FROM application_forms WHERE is_open=1 ORDER BY sort_order,title");res.render('applications/index',{forms});});
router.get('/:slug',async(req,res,next)=>{const [[form]]=await db.query('SELECT * FROM application_forms WHERE slug=? AND is_open=1',[req.params.slug]);if(!form)return next();const [questions]=await db.query('SELECT * FROM application_questions WHERE form_id=? ORDER BY sort_order,id',[form.id]);let guildMember=false;try{guildMember=await isGuildMember(req.session.user.discord_id);}catch(e){console.error('[Discord membership]',e.response?.data||e.message);}res.render('applications/form',{form,questions,guildMember});});
router.post('/:slug',async(req,res,next)=>{try{const result=await require('../services/applications').submitUser(req.session.user.id,req.params.slug,req.body);res.render('message',{title:'Application submitted',message:'Your application #'+result.application_id+' was submitted successfully.'});}catch(e){if(e.status)return res.status(e.status).render('message',{title:'Application unavailable',message:e.message});next(e);}});
module.exports=router;
