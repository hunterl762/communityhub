-- CommunityHub V3 - Department readiness and staffing targets
-- HeidiSQL / MariaDB 10.4 compatible migration.
-- Run after 019_loa_activity_management.sql with the CommunityHub database selected.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS department_readiness_settings (
  department_id BIGINT UNSIGNED NOT NULL,
  minimum_on_duty INT UNSIGNED NOT NULL DEFAULT 0,
  minimum_supervisors INT UNSIGNED NOT NULL DEFAULT 0,
  warning_when_below TINYINT(1) NOT NULL DEFAULT 1,
  critical_when_empty TINYINT(1) NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (department_id),
  CONSTRAINT fk_department_readiness_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_department_readiness_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS command_alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alert_type VARCHAR(80) NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
  department_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  fingerprint VARCHAR(191) NULL,
  is_resolved TINYINT(1) NOT NULL DEFAULT 0,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_command_alert_fingerprint (fingerprint),
  KEY idx_command_alert_open (is_resolved,severity,created_at),
  CONSTRAINT fk_command_alert_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
