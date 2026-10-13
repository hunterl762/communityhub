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
    if(e.needsDiscordReauth)return res.status(401).render('message',{title:'Verify Discord membership',message:'Use Discord sign-in once more to verify that you belong to the community server.',actionHref:'/auth/discord',actionLabel:'Verify with Discord'});
    const status=e.response?.status;const reason=status===401?'Discord bot token rejected. Update DISCORD_BOT_TOKEN in the website .env and restart.':status===403?'Discord denied guild access. Check the bot is in DISCORD_GUILD_ID.':status===400?'Discord rejected the request. Check DISCORD_GUILD_ID and the account Discord ID.':e.message?.includes('DISCORD_GUILD_ID')?'Configure DISCORD_GUILD_ID and DISCORD_BOT_TOKEN in the website .env.':'Discord verification is temporarily unavailable.';console.error('[Community membership]',status?'HTTP '+status:(e.code||'Unavailable'),reason);
    res.status(503).render('message',{title:'Membership verification unavailable',message:'We could not verify your community Discord membership. Please try again shortly.'});
  }
}
module.exports={membership,requireCommunityMember};
