const express=require('express');
const crypto=require('crypto');
const axios=require('axios');
const pool=require('../db');
const router=express.Router();

function safeUser(row){return {id:row.id,username:row.username,display_name:row.display_name,email:row.email,discord_id:row.discord_id,avatar_url:row.avatar_url,role:row.role};}

router.get('/login',(req,res)=>res.render('auth/login',{error:req.query.error||null}));
router.get('/register',(req,res)=>res.redirect('/auth/discord'));
router.post('/login',(req,res)=>res.redirect('/auth/discord'));
router.post('/register',(req,res)=>res.redirect('/auth/discord'));

function beginDiscord(req,res){
  if(!process.env.DISCORD_CLIENT_ID||!process.env.DISCORD_CALLBACK_URL)return res.redirect('/auth/login?error=Discord+OAuth+is+not+configured');
  const state=crypto.randomBytes(24).toString('hex');
  req.session.discordOAuth={state};
  const p=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,redirect_uri:process.env.DISCORD_CALLBACK_URL,response_type:'code',scope:'identify email',state,prompt:'consent'});
  res.redirect(`https://discord.com/oauth2/authorize?${p}`);
}
router.get('/discord',beginDiscord);
router.get('/discord/callback',async(req,res)=>{
  try{
    const pending=req.session.discordOAuth;
    if(!pending||!req.query.state||req.query.state!==pending.state||!req.query.code)return res.redirect('/auth/login?error=Discord+authentication+failed');
    delete req.session.discordOAuth;
    const body=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,client_secret:process.env.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:String(req.query.code),redirect_uri:process.env.DISCORD_CALLBACK_URL});
    const token=await axios.post('https://discord.com/api/oauth2/token',body,{headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    const profile=(await axios.get('https://discord.com/api/users/@me',{headers:{Authorization:`Bearer ${token.data.access_token}`}})).data;
    const avatar=profile.avatar?`https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`:null;
    const email=profile.email?String(profile.email).toLowerCase():null;
    const [existing]=await pool.query('SELECT * FROM users WHERE discord_id=? LIMIT 1',[profile.id]);
    let user;
    if(existing.length){
      await pool.query('UPDATE users SET discord_username=?,username=?,display_name=?,avatar_url=?,email=COALESCE(?,email),email_verified=? WHERE id=?',[profile.username,profile.username,profile.global_name||profile.username,avatar,email,profile.verified?1:0,existing[0].id]);
      [user]=(await pool.query('SELECT * FROM users WHERE id=?',[existing[0].id]))[0];
    }else{
      let byEmail=[];
      if(email)[byEmail]=await pool.query('SELECT * FROM users WHERE email=? LIMIT 1',[email]);
      if(byEmail.length){
        await pool.query('UPDATE users SET discord_id=?,discord_username=?,username=?,display_name=?,avatar_url=?,email_verified=? WHERE id=?',[profile.id,profile.username,profile.username,profile.global_name||profile.username,avatar,profile.verified?1:0,byEmail[0].id]);
        [user]=(await pool.query('SELECT * FROM users WHERE id=?',[byEmail[0].id]))[0];
      }else{
        const [result]=await pool.query('INSERT INTO users(discord_id,discord_username,username,display_name,avatar_url,email,email_verified) VALUES(?,?,?,?,?,?,?)',[profile.id,profile.username,profile.username,profile.global_name||profile.username,avatar,email,profile.verified?1:0]);
        [user]=(await pool.query('SELECT * FROM users WHERE id=?',[result.insertId]))[0];
      }
    }
    req.session.user=safeUser(user);
    res.redirect('/account');
  }catch(e){console.error('[Discord OAuth]',e.response?.data||e);res.redirect('/auth/login?error=Discord+authentication+failed');}
});
router.post('/logout',(req,res)=>req.session.destroy(()=>res.redirect('/')));
module.exports=router;