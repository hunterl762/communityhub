# LMS assessments and completion

Apply `sql/migrations/022_lms_assessment_attempts.sql` after migration 021, before running this version. It was tested on MariaDB 10.4.34, including a second execution. Select the target database in HeidiSQL; no delimiter changes or stored procedures are needed. Existing LMS question and answer tables are reused.

In **My Training → Course management**, create a draft course, add a module and assessment lesson, then add questions. Single-choice questions accept 2–8 choices; true/false questions use True as choice 1 and False as choice 2. Each question has exactly one correct answer and positive points. Configure the certification and optional validity period in course settings. Publication requires at least one required lesson and valid questions for every assessment. Put a course back into draft before adding materials or questions; existing completions remain historical records.

Learners must enroll and meet prerequisites. The server calculates a weighted assessment percentage from stored answers. The course passing score applies to each assessment, defaulting to 70% when blank. Failed attempts can be retried; a failed retake does not erase a pass. Optional lessons do not block completion or affect the final score. The final score averages passed required assessment scores; courses without required assessments have no final score. A course with no required lessons cannot complete.

Completing all required lessons awards the configured certification, sets its expiry, creates a notification and audit entry, and invokes `lms_completed` workflows. These writes share a transaction and enrollment lock; duplicate requests do not award twice. Existing certification records are renewed through their unique member/certification key. Workflow action failures use the existing Flow execution log. Existing completed enrollments are not retrospectively awarded certifications by this migration.

Create an **LMS completed** flow under Administration → Workflows. Context fields include `course_id`, `enrollment_id`, `subject_user_id`, `score`, `certification_id`, `entity_type` (`lms_course`) and `entity_id` (course ID). This separate trigger leaves instructor-led training workflows intact.

## FiveM API

Both endpoints require `x-communityhub-key`, plus `license` and `server_key` query parameters. Use the player's license from the FiveM server rather than accepting an arbitrary client-supplied identity. Keep API credentials on the server. Server-bound credentials must match `server_key`. Disabled servers and inactive or unlinked accounts are rejected. Responses use `Cache-Control: no-store`.

- `GET /api/fivem/lms/progress?license=license:…&server_key=primary` returns the linked member's enrollments (including historical course status), completion dates, scores, progress and currently valid certifications.
- `GET /api/fivem/lms/requirements?license=license:…&server_key=primary` returns published community-wide and member-department courses, their required lessons, prerequisite completion, passing scores and enrollment eligibility. Catalog availability does not imply a mandatory assignment.

These endpoints are read-only. They expose no question answers or grading keys. Assessments remain in the web LMS; the existing FiveM client is unchanged. CommunityHub remains a CMS + LMS with FiveM integration.

## Verification

On a separate disposable MariaDB server, run `LMS_TEST_PORT=33317 node tests/lms-assessments.cjs` (PowerShell: `$env:LMS_TEST_PORT='33317'; node tests/lms-assessments.cjs`). The test creates and removes its own database. It covers migration replay, publication checks, weighted grading, invalid choices, enrollment isolation, failed attempts, award rollback, concurrent completion, expiry, workflow delivery and authenticated FiveM endpoints.
