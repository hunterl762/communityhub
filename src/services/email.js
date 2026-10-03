const nodemailer=require('nodemailer');

let transporter;
function getTransporter(){
  if(transporter)return transporter;
  if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS)throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.');
  transporter=nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:Number(process.env.SMTP_PORT||587),
    secure:String(process.env.SMTP_SECURE||'false').toLowerCase()==='true',
    auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}
  });
  return transporter;
}

async function sendVerificationEmail({email,name,token}){
  const base=String(process.env.BASE_URL||'http://localhost:3020').replace(/\/$/,'');
  const url=`${base}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const from=process.env.MAIL_FROM||process.env.SMTP_USER;
  const community=process.env.COMMUNITY_NAME||'Community Hub';
  return getTransporter().sendMail({
    from,
    to:email,
    subject:`Verify your email | ${community}`,
    text:`Hello ${name||'there'},\n\nVerify your ${community} email address by opening this link:\n${url}\n\nThis link expires in 60 minutes. If you did not create this account, you can ignore this email.`,
    html:`<!doctype html><html><body style="margin:0;background:#071019;color:#eef6ff;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:40px 24px"><div style="background:#0d1925;border:1px solid #1f3548;border-radius:16px;padding:32px"><div style="color:#43d9ff;font-weight:800;letter-spacing:.12em">${community.toUpperCase()}</div><h1>Verify your email</h1><p style="color:#b5c6d6">Hello ${name||'there'}, confirm this email address to finish securing your Community Hub account.</p><p style="margin:30px 0"><a href="${url}" style="background:#43d9ff;color:#031018;text-decoration:none;font-weight:800;padding:13px 20px;border-radius:9px;display:inline-block">Verify Email Address</a></p><p style="color:#91a5b8;font-size:13px">This verification link expires in 60 minutes. If you did not create this account, no action is required.</p></div></div></body></html>`
  });
}
module.exports={sendVerificationEmail};