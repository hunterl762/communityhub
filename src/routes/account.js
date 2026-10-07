const express=require('express');
const pool=require('../db');
const crypto=require('crypto');
const router=express.Router();
function requireAuth(req,res,next){if(!req.session.user)return res.redirect('/auth/login');next();}
router.use(requireAuth,(req,res,next)=>{res.set('Cache-Control','private, no-store');next();});
router.get('/',async(req,res,next)=>{try{const [rows]=await pool.query('SELECT id,username,display_name,email,email_verified,discord_id,discord_username,avatar_url,role,bio,created_at FROM users WHERE id=?',[req.session.user.id]);if(!rows.length){req.session.destroy(()=>{});return res.redirect('/auth/login');}req.session.profileToken ||= crypto.randomBytes(32).toString('hex');res.render('account/index',{account:rows[0],error:req.query.error||null,csrf:req.session.profileToken,saved:req.query.saved==='1'});}catch(e){next(e);}});
router.post('/bio',async(req,res,next)=>{
  const supplied=Buffer.from(String(req.body._csrf||'')),expected=Buffer.from(req.session.profileToken||'');
  if(!expected.length||supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected))return res.status(403).render('message',{title:'Session expired',message:'Reload your account page before saving your bio.'});
  if(typeof req.body.bio!=='string'||req.body.bio.length>1000)return res.status(400).render('message',{title:'Bio too long',message:'Your bio must contain no more than 1,000 characters.'});
  try{const [result]=await pool.query('UPDATE users SET bio=? WHERE id=? AND is_active=1',[req.body.bio.trim(),req.session.user.id]);if(!result.affectedRows)return res.status(403).render('message',{title:'Account unavailable',message:'This account cannot update its profile.'});res.redirect('/account?saved=1');}catch(e){next(e);}
});
module.exports=router;
