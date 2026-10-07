-- CommunityHub V3 - CommunityHub Flow
-- HeidiSQL / MariaDB 10.4 compatible migration.
-- Safe to execute from HeidiSQL Query tab with the target database selected.
-- No DELIMITER statements, stored procedures, generated columns, or MySQL 8-only syntax.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS automation_flows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  trigger_type ENUM('application_submitted','application_status_changed','training_registered','training_completed','member_status_changed','manual') NOT NULL,
  trigger_config_json LONGTEXT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_automation_flows_enabled_trigger (is_enabled,trigger_type),
  KEY idx_automation_flows_created_by (created_by),
  CONSTRAINT fk_automation_flows_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_automation_flows_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_conditions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flow_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  field_name VARCHAR(120) NOT NULL,
  operator_name ENUM('equals','not_equals','contains','not_contains','in','not_in','is_empty','is_not_empty') NOT NULL DEFAULT 'equals',
  comparison_value TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_automation_conditions_flow (flow_id,sort_order),
  CONSTRAINT fk_automation_conditions_flow FOREIGN KEY (flow_id) REFERENCES automation_flows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_actions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flow_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  action_type ENUM('create_notification','set_member_status','set_recruit_stage','write_staff_note','write_audit_log') NOT NULL,
  action_config_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_automation_actions_flow (flow_id,sort_order),
  CONSTRAINT fk_automation_actions_flow FOREIGN KEY (flow_id) REFERENCES automation_flows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flow_id BIGINT UNSIGNED NOT NULL,
  trigger_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id BIGINT UNSIGNED NULL,
  subject_user_id BIGINT UNSIGNED NULL,
  status ENUM('running','success','skipped','failed') NOT NULL DEFAULT 'running',
  context_json LONGTEXT NULL,
  error_message TEXT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_automation_runs_flow_started (flow_id,started_at),
  KEY idx_automation_runs_status_started (status,started_at),
  KEY idx_automation_runs_subject (subject_user_id),
  CONSTRAINT fk_automation_runs_flow FOREIGN KEY (flow_id) REFERENCES automation_flows(id) ON DELETE CASCADE,
  CONSTRAINT fk_automation_runs_subject FOREIGN KEY (subject_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_action_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id BIGINT UNSIGNED NOT NULL,
  action_id BIGINT UNSIGNED NULL,
  action_type VARCHAR(80) NOT NULL,
  status ENUM('success','skipped','failed') NOT NULL,
  result_json LONGTEXT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_automation_action_runs_run (run_id,id),
  CONSTRAINT fk_automation_action_runs_run FOREIGN KEY (run_id) REFERENCES automation_runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_automation_action_runs_action FOREIGN KEY (action_id) REFERENCES automation_actions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
