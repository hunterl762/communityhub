const db = require('../db');
const {grade,assessment} = require('./lms');
const fail = message => { throw Object.assign(new Error(message), {status:400}); };
function questionInput(body) {
  const text = String(body.question_text || '').trim();
  const type = body.question_type === 'true_false' ? 'true_false' : 'single';
  const choices = type === 'true_false' ? ['True','False'] : String(body.choices || '').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const correct = Number(body.correct_choice), points = Number(body.points || 1);
  if (!text || text.length > 4000 || choices.length < 2 || choices.length > 8 || choices.some(s=>s.length>1000) || !Number.isInteger(correct) || correct < 1 || correct > choices.length || !Number.isFinite(points) || points < 0.01 || points > 1000) fail('Enter a question, 2–8 choices, a valid correct choice number, and points between 0.01 and 1000.');
  return {text,type,choices,correct,points};
}
async function addQuestion(courseId,lessonId,body) {
  const input = questionInput(body), conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[course]]=await conn.query('SELECT status FROM lms_courses WHERE id=? FOR UPDATE',[courseId]);
    if (!course || course.status !== 'draft') fail('Set the course to draft before editing assessments.');
    const [[lesson]]=await conn.query("SELECT l.id FROM lms_lessons l JOIN lms_modules m ON m.id=l.module_id WHERE l.id=? AND m.course_id=? AND l.lesson_type='quiz'",[lessonId,courseId]);
    if (!lesson) fail('Assessment not found in this course.');
    const [[order]]=await conn.query('SELECT COALESCE(MAX(sort_order),-1)+1 n FROM lms_quiz_questions WHERE lesson_id=?',[lessonId]);
    const [result]=await conn.query('INSERT INTO lms_quiz_questions(lesson_id,question_text,question_type,points,sort_order) VALUES(?,?,?,?,?)',[lessonId,input.text,input.type,input.points,order.n]);
    for (const [i,text] of input.choices.entries()) await conn.query('INSERT INTO lms_quiz_answers(question_id,answer_text,is_correct,sort_order) VALUES(?,?,?,?)',[result.insertId,text,i+1===input.correct?1:0,i]);
    await conn.commit();
  } catch(e) {await conn.rollback();throw e;} finally {conn.release();}
}
async function settings(courseId,body) {
  const title=String(body.title||'').trim(), status=body.status;
  const number=(value,min,max)=>{if(value==null||value==='')return null;const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)fail('Course settings contain an invalid number.');return n;};
  const score=number(body.passing_score,0,100), minutes=number(body.estimated_minutes,1,100000), validity=number(body.certificate_valid_days,1,36500), cert=number(body.certification_id,1,Number.MAX_SAFE_INTEGER);
  if(!title||title.length>180||!['draft','published','archived'].includes(status)||[minutes,validity,cert].some(n=>n!==null&&!Number.isInteger(n)))fail('Enter valid course settings.');
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[course]]=await conn.query('SELECT id FROM lms_courses WHERE id=? FOR UPDATE',[courseId]);
    if(!course)fail('Course not found.');
    if(cert){const [[c]]=await conn.query('SELECT id FROM certifications WHERE id=?',[cert]);if(!c)fail('Certification not found.');}
    if(status==='published'){
      const [lessons]=await conn.query('SELECT l.* FROM lms_lessons l JOIN lms_modules m ON m.id=l.module_id WHERE m.course_id=?',[courseId]);
      if(!lessons.some(l=>Number(l.is_required)))fail('Add at least one required lesson before publishing.');
      for(const lesson of lessons.filter(l=>l.lesson_type==='quiz')){const data=await assessment(conn,lesson.id,true);const selections={};for(const q of data.questions)selections[q.id]=data.answers.find(a=>String(a.question_id)===String(q.id))?.id;grade(data.questions,data.answers,selections);}
    }
    await conn.query('UPDATE lms_courses SET title=?,description=?,status=?,passing_score=?,estimated_minutes=?,certification_id=?,certificate_valid_days=? WHERE id=?',[title,String(body.description||'').trim()||null,status,score,minutes,cert,validity,courseId]);
    await conn.commit();
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
async function addStructure(courseId,moduleId,body) {
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[course]]=await conn.query('SELECT status FROM lms_courses WHERE id=? FOR UPDATE',[courseId]);
    if(!course||course.status!=='draft')fail('Set the course to draft before adding materials.');
    const title=String(body.title||'').trim();
    if(!title||title.length>180)fail('Enter a title up to 180 characters.');
    if(moduleId){
      const [[module]]=await conn.query('SELECT id FROM lms_modules WHERE id=? AND course_id=?',[moduleId,courseId]);
      if(!module)fail('Module not found in this course.');
      if(!['content','video','resource','quiz'].includes(body.lesson_type))fail('Select a lesson type.');
      const url=String(body.resource_url||'').trim();
      if(url && (!/^https?:\/\//i.test(url)||url.length>1000))fail('Resources must use an HTTP or HTTPS URL.');
      const minutes=body.estimated_minutes?Number(body.estimated_minutes):null;
      if(minutes!==null&&(!Number.isInteger(minutes)||minutes<1||minutes>100000))fail('Enter valid estimated minutes.');
      const [[order]]=await conn.query('SELECT COALESCE(MAX(sort_order),-1)+1 n FROM lms_lessons WHERE module_id=?',[moduleId]);
      await conn.query('INSERT INTO lms_lessons(module_id,title,lesson_type,content,resource_url,estimated_minutes,sort_order,is_required) VALUES(?,?,?,?,?,?,?,?)',[moduleId,title,body.lesson_type,String(body.content||'').trim()||null,url||null,minutes,order.n,body.is_required?1:0]);
    }else{
      const [[order]]=await conn.query('SELECT COALESCE(MAX(sort_order),-1)+1 n FROM lms_modules WHERE course_id=?',[courseId]);
      await conn.query('INSERT INTO lms_modules(course_id,title,description,sort_order) VALUES(?,?,?,?)',[courseId,title,String(body.description||'').trim()||null,order.n]);
    }
    await conn.commit();
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
module.exports={questionInput,addQuestion,settings,addStructure};
