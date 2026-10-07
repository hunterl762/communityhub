const db=require('../db');
const discord=require('../services/discord');

async function membership(req){
  if(!req.session.user?.id)return false;
  const [[account]]=await db.query('SELECT discord_id,is_active FROM users WHERE id=?',[req.session.user.id]);
  if(!account?.is_active||!account.discord_id)return false;
  return discord.isGuildMember(account.discord_id);
}
async function requireCommunityMember(req,res,next){
  res.set('Cache-Control','private, no-store');
  if(!req.session.user)return res.redirect('/auth/login');
  try{
    if(!await membership(req))return res.status(403).render('message',{title:'Community members only',message:'Join the community Discord and sign in with that Discord account to access this section.'});
    next();
  }catch(e){
    console.error('[Community membership]',e.code||e.response?.status||'Verification unavailable');
    res.status(503).render('message',{title:'Membership verification unavailable',message:'We could not verify your community Discord membership. Please try again shortly.'});
  }
}
module.exports={membership,requireCommunityMember};
