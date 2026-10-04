const axios=require('axios');
async function isGuildMember(discordId){
  if(!process.env.DISCORD_GUILD_ID||!process.env.DISCORD_BOT_TOKEN)throw new Error('DISCORD_GUILD_ID and DISCORD_BOT_TOKEN are required for guild membership checks.');
  try{
    await axios.get(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`,{headers:{Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN}`}});
    return true;
  }catch(e){if(e.response&&e.response.status===404)return false;throw e;}
}
module.exports={isGuildMember};