-- CommunityHub V3 - Staff activity tracking
-- HeidiSQL / MariaDB 10.4 compatible migration.
-- Run after 017_training_certification_rules.sql with the CommunityHub database selected.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS staff_activity_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  patrol_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  patrol_sessions INT UNSIGNED NOT NULL DEFAULT 0,
  training_completed INT UNSIGNED NOT NULL DEFAULT 0,
  reports_handled INT UNSIGNED NOT NULL DEFAULT 0,
  requirement_minutes INT UNSIGNED NULL,
  requirement_met TINYINT(1) NOT NULL DEFAULT 0,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_activity_period (user_id,period_start,period_end),
  KEY idx_staff_activity_period (period_start,period_end),
  KEY idx_staff_activity_requirement (requirement_met,period_end),
  CONSTRAINT fk_staff_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_activity_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  previous_status ENUM('active','watch','inactive','exempt') NULL,
  new_status ENUM('active','watch','inactive','exempt') NOT NULL,
  reason VARCHAR(500) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_staff_activity_status_user (user_id,created_at),
  KEY idx_staff_activity_status_new (new_status,created_at),
  CONSTRAINT fk_staff_activity_status_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_activity_status_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
