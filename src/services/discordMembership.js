const crypto=require('crypto');
const axios=require('axios');
const db=require('../db');
const scope='guilds.members.read';
function reauth(){return Object.assign(new Error('Verify your Discord server membership by signing in again.'),{needsDiscordReauth:true,status:401});}
function key(){const secret=process.env.DISCORD_TOKEN_SECRET||process.env.SESSION_SECRET;if(!secret||secret.length<32)throw Object.assign(new Error('Configure a private DISCORD_TOKEN_SECRET of at least 32 characters.'),{status:503});return crypto.createHash('sha256').update(secret).digest();}
function encrypt(id,data){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from('communityhub:'+id));const bytes=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:bytes.toString('base64')});}
function decrypt(id,text){try{const value=JSON.parse(text),cipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(value.iv,'base64'));cipher.setAAD(Buffer.from('communityhub:'+id));cipher.setAuthTag(Buffer.from(value.tag,'base64'));return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.data,'base64')),cipher.final()]).toString('utf8'));}catch{throw reauth();}}
async function store(userId,token,query=db.query.bind(db)){if(!token.access_token||!String(token.scope||'').split(' ').includes(scope))throw reauth();const seconds=Math.max(1,Math.min(864000,Number(token.expires_in)||0));await query('INSERT INTO discord_membership_tokens(user_id,client_id,token_cipher,expires_at) VALUES(?,?,?,DATE_ADD(NOW(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE client_id=VALUES(client_id),token_cipher=VALUES(token_cipher),expires_at=VALUES(expires_at)',[userId,process.env.DISCORD_CLIENT_ID,encrypt(userId,{access_token:token.access_token,refresh_token:token.refresh_token||null,scope:token.scope}),seconds]);}
async function loadAuthorization(discordId){const [[row]]=await db.query('SELECT t.*,TIMESTAMPDIFF(SECOND,NOW(),t.expires_at) remaining FROM discord_membership_tokens t JOIN users u ON u.id=t.user_id WHERE u.discord_id=? AND u.is_active=1',[discordId]);return row;}
async function verifyMembership(discordId,row){
 if(!row)return null;
 if(row.client_id!==process.env.DISCORD_CLIENT_ID)throw reauth();
 let token=decrypt(row.user_id,row.token_cipher);
 if(Number(row.remaining)<=30){const connection=await db.getConnection();try{await connection.beginTransaction();const [[fresh]]=await connection.query('SELECT *,TIMESTAMPDIFF(SECOND,NOW(),expires_at) remaining FROM discord_membership_tokens WHERE user_id=? FOR UPDATE',[row.user_id]);if(!fresh)throw reauth();token=decrypt(row.user_id,fresh.token_cipher);if(Number(fresh.remaining)<=30){if(!token.refresh_token)throw reauth();try{const response=await axios.post('https://discord.com/api/oauth2/token',new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,client_secret:process.env.DISCORD_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:token.refresh_token}),{headers:{'Content-Type':'application/x-www-form-urlencoded'},timeout:10000});token={...response.data,scope:response.data.scope||token.scope};await store(row.user_id,token,connection.query.bind(connection));}catch(e){if([400,401,403].includes(e.response?.status))throw reauth();throw e;}}await connection.commit();}catch(e){await connection.rollback();throw e;}finally{connection.release();}}
 if(!/^\d{17,20}$/.test(process.env.DISCORD_GUILD_ID||''))throw Object.assign(new Error('Configure the community DISCORD_GUILD_ID.'),{status:503});
 try{const response=await axios.get('https://discord.com/api/v10/users/@me/guilds/'+process.env.DISCORD_GUILD_ID+'/member',{headers:{Authorization:'Bearer '+token.access_token},timeout:10000});if(response.data.user?.id&&response.data.user.id!==discordId)throw reauth();return true;}catch(e){if(e.response?.status===404)return false;if([401,403].includes(e.response?.status))throw reauth();throw e;}
}
const verified=new Map(),pending=new Map(),blocked=new Map();
function unavailable(seconds){return Object.assign(new Error('Discord is rate limited. Membership verification will retry shortly.'),{response:{status:429,data:{retry_after:seconds}}});}
async function membership(discordId){
 const row=await loadAuthorization(discordId);if(!row)return null;
 const cacheKey=[discordId,row.user_id,process.env.DISCORD_CLIENT_ID,process.env.DISCORD_GUILD_ID,crypto.createHash('sha256').update(row.token_cipher).digest('hex')].join(':');
 const now=Date.now(),saved=verified.get(cacheKey);if(saved&&saved.until>now)return saved.member;
 const cooldown=blocked.get(cacheKey);if(cooldown&&cooldown>now)throw unavailable(Math.ceil((cooldown-now)/1000));
 if(pending.has(cacheKey))return pending.get(cacheKey);
 const promise=(async()=>{try{const member=await verifyMembership(discordId,row);const ttl=Math.max(0,Math.min(60,Number(process.env.DISCORD_MEMBERSHIP_CACHE_SECONDS??60)))*1000;if(ttl)verified.set(cacheKey,{member,until:Date.now()+(member?ttl:Math.min(ttl,10000))});blocked.delete(cacheKey);return member;}catch(error){if(error.response?.status===429){const supplied=Number(error.response.data?.retry_after||error.response.headers?.['retry-after']||10);blocked.set(cacheKey,Date.now()+Math.max(1,Number.isFinite(supplied)?supplied:10)*1000);throw unavailable(supplied);}throw error;}})();
 pending.set(cacheKey,promise);try{return await promise;}finally{pending.delete(cacheKey);if(verified.size+blocked.size>2000){for(const [key,value] of verified)if(value.until<=Date.now())verified.delete(key);for(const [key,value] of blocked)if(value<=Date.now())blocked.delete(key);if(verified.size>2000)verified.delete(verified.keys().next().value);}}
}
module.exports={store,membership};
