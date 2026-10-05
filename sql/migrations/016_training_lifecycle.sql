-- CommunityHub V3 - Training lifecycle
-- HeidiSQL / MariaDB 10.4 compatible migration.
-- Run after 015_communityhub_flow.sql with the CommunityHub database selected.
-- Additive migration. Existing training registrations are preserved.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE training_registrations
  ADD COLUMN IF NOT EXISTS result_status ENUM('pending','passed','failed','incomplete') NOT NULL DEFAULT 'pending' AFTER status,
  ADD COLUMN IF NOT EXISTS score DECIMAL(5,2) NULL AFTER result_status,
  ADD COLUMN IF NOT EXISTS instructor_notes TEXT NULL AFTER score,
  ADD COLUMN IF NOT EXISTS completed_by BIGINT UNSIGNED NULL AFTER instructor_notes,
  ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL AFTER completed_by;

CREATE TABLE IF NOT EXISTS training_completion_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  training_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  registration_id BIGINT UNSIGNED NULL,
  result_status ENUM('passed','failed','incomplete') NOT NULL,
  score DECIMAL(5,2) NULL,
  instructor_notes TEXT NULL,
  completed_by BIGINT UNSIGNED NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_training_completion_user (user_id,completed_at),
  KEY idx_training_completion_training (training_id,completed_at),
  KEY idx_training_completion_registration (registration_id),
  KEY idx_training_completion_completed_by (completed_by),
  CONSTRAINT fk_training_completion_training FOREIGN KEY (training_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_completion_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_completion_registration FOREIGN KEY (registration_id) REFERENCES training_registrations(id) ON DELETE SET NULL,
  CONSTRAINT fk_training_completion_completed_by FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
