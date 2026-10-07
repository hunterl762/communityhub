-- Run after 021_lms_courses.sql. HeidiSQL / MariaDB 10.4 compatible.
-- Reuses the existing question, answer, progress and certification tables.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS lms_assessment_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enrollment_id BIGINT UNSIGNED NOT NULL,
  lesson_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  passed TINYINT(1) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), KEY idx_lms_attempt_enrollment(enrollment_id,lesson_id,id),
  CONSTRAINT fk_lms_attempt_enrollment FOREIGN KEY(enrollment_id) REFERENCES lms_enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_lms_attempt_lesson FOREIGN KEY(lesson_id) REFERENCES lms_lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE automation_flows MODIFY COLUMN trigger_type ENUM('application_submitted','application_status_changed','training_registered','training_completed','member_status_changed','manual','lms_completed') NOT NULL;
