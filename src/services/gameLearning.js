const db = require('../db');
const fail=(message,status)=>{throw Object.assign(new Error(message),{status});};
async function linked(license,serverKey) {
  if(!license||!serverKey)fail('Linked player license and server_key are required.',400);
  const [[server]]=await db.query('SELECT id FROM fivem_servers WHERE server_key=? AND is_enabled=1',[serverKey]);
  if(!server)fail('Server not configured or disabled.',404);
  const [[user]]=await db.query('SELECT id,department_id,is_active,discord_id FROM users WHERE fivem_license=?',[license]);
  if(!user)fail('Account not linked.',404);
  if(!user.is_active)fail('Account is inactive.',403);
  if(!user.discord_id)fail('Join the community Discord to view training.',403);
  try{if(!await require('./discord').isGuildMember(user.discord_id))fail('Join the community Discord to view training.',403);}catch(e){if(e.status)throw e;fail('Discord membership verification is unavailable. Try again shortly.',503);}
  return user;
}
async function progressFor(user,includeExpired=false) {
  const [courses]=await db.query(`SELECT c.id,c.title,c.status course_status,e.status,e.progress_percent,e.final_score,e.completed_at FROM lms_enrollments e JOIN lms_courses c ON c.id=e.course_id WHERE e.user_id=? ORDER BY c.title`,[user.id]);
  const [certifications]=await db.query(`SELECT c.id,c.name,uc.awarded_at,uc.expires_at,CASE WHEN uc.expires_at<=NOW() THEN 'expired' WHEN uc.expires_at<=DATE_ADD(NOW(),INTERVAL 30 DAY) THEN 'expiring' ELSE 'valid' END validity_status FROM user_certifications uc JOIN certifications c ON c.id=uc.certification_id WHERE uc.user_id=? ${includeExpired?'':'AND (uc.expires_at IS NULL OR uc.expires_at>NOW())'} ORDER BY c.name`,[user.id]);
  return {ok:true,courses,certifications};
}
async function requirementsFor(user) {
  // Availability is distinct from assignment: department courses are not automatically mandatory.
  const [courses]=await db.query(`SELECT c.id,c.title,c.description,c.certificate_valid_days,c.passing_score,c.estimated_minutes,c.certification_id,e.status enrollment_status,e.progress_percent FROM lms_courses c LEFT JOIN lms_enrollments e ON e.course_id=c.id AND e.user_id=? WHERE c.status='published' AND (c.department_id IS NULL OR c.department_id=?) ORDER BY c.title`,[user.id,user.department_id]);
  for(const course of courses){
    const [prerequisites]=await db.query(`SELECT c.id,c.title,(e.id IS NOT NULL) completed FROM lms_course_prerequisites p JOIN lms_courses c ON c.id=p.prerequisite_course_id LEFT JOIN lms_enrollments e ON e.course_id=c.id AND e.user_id=? AND e.status='completed' WHERE p.course_id=?`,[user.id,course.id]);
    const [lessons]=await db.query(`SELECT l.id,l.title,l.lesson_type,COALESCE(p.status,'not_started') status,p.score FROM lms_lessons l JOIN lms_modules m ON m.id=l.module_id LEFT JOIN lms_enrollments e ON e.course_id=m.course_id AND e.user_id=? LEFT JOIN lms_lesson_progress p ON p.enrollment_id=e.id AND p.lesson_id=l.id WHERE m.course_id=? AND l.is_required=1 ORDER BY m.sort_order,l.sort_order,l.id`,[user.id,course.id]);
    course.prerequisites=prerequisites;course.required_lessons=lessons;course.can_enroll=prerequisites.every(p=>Number(p.completed)===1);course.passing_score=Number(course.passing_score??70);
  }
  return {ok:true,courses};
}
async function progress(license,key){return progressFor(await linked(license,key));}
async function requirements(license,key){return requirementsFor(await linked(license,key));}
function websitePath(path){try{const url=new URL(process.env.BASE_URL);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;return new URL(path,url).href;}catch{return null;}}
async function summary(license,key){
  const user=await linked(license,key);
  const [progress,requirements]=await Promise.all([progressFor(user,true),requirementsFor(user)]);
  return {ok:true,updated_at:new Date().toISOString(),website_url:websitePath('/lms'),courses:progress.courses.map(c=>({...c,website_url:websitePath('/lms/courses/'+c.id)})),available_courses:requirements.courses.map(c=>({...c,website_url:websitePath('/lms/courses/'+c.id)})),certifications:progress.certifications};
}
module.exports={progress,requirements,summary};
