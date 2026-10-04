const express=require('express');
const pool=require('../db');
const router=express.Router();
function requireAuth(req,res,next){if(!req.session.user)return res.redirect('/auth/login');next();}
router.get('/',requireAuth,async(req,res)=>{const [rows]=await pool.query('SELECT id,username,display_name,email,email_verified,discord_id,discord_username,avatar_url,role,created_at FROM users WHERE id=?',[req.session.user.id]);if(!rows.length){req.session.destroy(()=>{});return res.redirect('/auth/login');}res.render('account/index',{account:rows[0],error:req.query.error||null});});
module.exports=router;