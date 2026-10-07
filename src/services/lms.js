const db = require('../db');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), {status}); };
function grade(questions, answers, selections) {
  if (!questions.length) fail('This assessment has no questions yet.', 409);
  let earned = 0, total = 0;
  for (const q of questions) {
    const options = answers.filter(a => String(a.question_id) === String(q.id));
    if (options.length < 2 || options.filter(a => Number(a.is_correct) === 1).length !== 1 || !(Number(q.points) > 0)) fail('This assessment is not ready. Contact your instructor.', 409);
    const selected = options.find(a => String(a.id) === String(selections[q.id]));
    if (!selected) fail('Answer every question using one of its listed choices.');
    total += Number(q.points);
    if (Number(selected.is_correct) === 1) earned += Number(q.points);
  }
  return Math.round(earned / total * 10000) / 100;
}
async function assessment(conn, lessonId, includeKey = false) {
  const [questions] = await conn.query('SELECT id,question_text,question_type,points FROM lms_quiz_questions WHERE lesson_id=? ORDER BY sort_order,id', [lessonId]);
  const [answers] = await conn.query(`SELECT a.id,a.question_id,a.answer_text${includeKey ? ',a.is_correct' : ''} FROM lms_quiz_answers a JOIN lms_quiz_questions q ON q.id=a.question_id WHERE q.lesson_id=? ORDER BY a.sort_order,a.id`, [lessonId]);
  return {questions, answers};
}
// Serialize writes for an enrollment so concurrent requests cannot award twice.
async function complete(userId, courseId, lessonId, selections = null) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[e]] = await conn.query(`SELECT e.*,c.title,c.status course_status,c.passing_score,c.certification_id,c.certificate_valid_days FROM lms_enrollments e JOIN lms_courses c ON c.id=e.course_id WHERE e.user_id=? AND e.course_id=? FOR UPDATE`, [userId, courseId]);
    if (!e) fail('Enroll in this course first.', 403);
    if (e.course_status !== 'published') fail('This course is unavailable.', 409);
    const [[lesson]] = await conn.query('SELECT l.* FROM lms_lessons l JOIN lms_modules m ON m.id=l.module_id WHERE l.id=? AND m.course_id=?', [lessonId, courseId]);
    if (!lesson) fail('Lesson not found.', 404);
    if (e.status === 'completed') { await conn.commit(); return {completed: true}; }
    let score = null, passed = true;
    if (lesson.lesson_type === 'quiz') {
      if (!selections || typeof selections !== 'object' || Array.isArray(selections)) fail('Submit the assessment to complete this lesson.');
      const data = await assessment(conn, lessonId, true);
      score = grade(data.questions, data.answers, selections);
      passed = score >= Number(e.passing_score ?? 70);
      await conn.query('INSERT INTO lms_assessment_attempts(enrollment_id,lesson_id,score,passed) VALUES(?,?,?,?)', [e.id, lessonId, score, passed ? 1 : 0]);
    } else if (selections !== null) fail('This lesson is not an assessment.');
    // Failed retakes retain a previous pass and its score.
    await conn.query(`INSERT INTO lms_lesson_progress(enrollment_id,lesson_id,status,score,started_at,completed_at) VALUES(?,?,?,?,NOW(),IF(?=1,NOW(),NULL)) ON DUPLICATE KEY UPDATE score=IF(status='completed',score,VALUES(score)),completed_at=IF(status='completed',completed_at,VALUES(completed_at)),status=IF(status='completed',status,VALUES(status)),started_at=COALESCE(started_at,NOW())`, [e.id, lessonId, passed ? 'completed' : 'in_progress', score, passed ? 1 : 0]);
    const [required] = await conn.query(`SELECT l.lesson_type,p.status,p.score FROM lms_lessons l JOIN lms_modules m ON m.id=l.module_id LEFT JOIN lms_lesson_progress p ON p.lesson_id=l.id AND p.enrollment_id=? WHERE m.course_id=? AND l.is_required=1`, [e.id, courseId]);
    const done = required.filter(l => l.status === 'completed' && (l.lesson_type !== 'quiz' || (l.score != null && Number(l.score) >= Number(e.passing_score ?? 70))));
    const completed = required.length > 0 && done.length === required.length;
    const pct = required.length ? Math.floor(done.length / required.length * 100) : 0;
    const quizzes = done.filter(l => l.lesson_type === 'quiz');
    const finalScore = quizzes.length ? quizzes.reduce((n,l) => n + Number(l.score), 0) / quizzes.length : null;
    await conn.query(`UPDATE lms_enrollments SET status=?,progress_percent=?,final_score=?,started_at=COALESCE(started_at,NOW()),completed_at=IF(?=1,NOW(),NULL) WHERE id=?`, [completed ? 'completed' : 'in_progress', pct, completed ? finalScore : null, completed ? 1 : 0, e.id]);
    if (completed) {
      if (e.certification_id) {
        const validity = e.certificate_valid_days || null;
        await conn.query(`INSERT INTO user_certifications(user_id,certification_id,awarded_at,expires_at,notes) VALUES(?,?,NOW(),IF(? IS NULL,NULL,DATE_ADD(NOW(),INTERVAL ? DAY)),?) ON DUPLICATE KEY UPDATE awarded_by=NULL,awarded_at=NOW(),expires_at=VALUES(expires_at),notes=VALUES(notes)`, [userId, e.certification_id, validity, validity, `Awarded by LMS course: ${e.title}`]);
      }
      await conn.query('INSERT INTO notifications(user_id,title,message,url) VALUES(?,?,?,?)', [userId, 'Course completed', `You completed ${e.title}${e.certification_id ? ' and earned its certification' : ''}.`, `/lms/courses/${courseId}`]);
      await conn.query('INSERT INTO audit_logs_v2(user_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?)', [userId, 'lms.completed', 'lms_enrollment', e.id, JSON.stringify({course_id: courseId, score: finalScore, certification_id: e.certification_id})]);
      await require('./automationFlow').emit('lms_completed', {entity_type: 'lms_course', entity_id: Number(courseId), subject_user_id: userId, course_id: Number(courseId), enrollment_id: e.id, score: finalScore, certification_id: e.certification_id}, null, {conn});
    }
    await conn.commit();
    return {completed, passed, score};
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
}
module.exports = {grade, assessment, complete};
