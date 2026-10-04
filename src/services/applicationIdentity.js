// Recognize the existing seeded identity question without affecting IDs, tags or free-text Discord questions.
function isDiscordUsername(q){return q.question_type==='text'&&/^(?:(?:what is|what's|enter|provide) (?:your )?|your )?discord user\s*name$/i.test(String(q.label||'').trim().replace(/[?:*]+$/g,'').trim());}
function questionsFor(questions,user){return questions.map(q=>isDiscordUsername(q)&&user?.discord_id&&user?.discord_username?{...q,prefill_value:user.discord_username,account_identity:true}:q);}
function answersFor(questions,answers,user){const result={...answers};for(const q of questions)if(isDiscordUsername(q)){if(!user?.discord_id||!user?.discord_username)throw Object.assign(new Error('Reconnect your Discord account to fill your Discord username.'),{status:403});result['q_'+q.id]=user.discord_username;}return result;}
module.exports={isDiscordUsername,questionsFor,answersFor};
