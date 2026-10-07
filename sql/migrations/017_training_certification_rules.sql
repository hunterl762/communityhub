-- CommunityHub V3 - Training certification and progression rules
-- HeidiSQL / MariaDB 10.4 compatible migration.
-- Run after 016_training_lifecycle.sql with the CommunityHub database selected.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS training_certification_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  training_id BIGINT UNSIGNED NOT NULL,
  certification_id BIGINT UNSIGNED NULL,
  minimum_score DECIMAL(5,2) NULL,
  advance_recruit_stage ENUM('accepted','recruit','training','evaluation','member','failed','removed') NULL,
  complete_probation TINYINT(1) NOT NULL DEFAULT 0,
  notify_member TINYINT(1) NOT NULL DEFAULT 1,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_training_cert_rule (training_id,certification_id),
  KEY idx_training_cert_rule_training (training_id,is_enabled),
  KEY idx_training_cert_rule_certification (certification_id),
  CONSTRAINT fk_training_cert_rule_training FOREIGN KEY (training_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_cert_rule_certification FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_cert_rule_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS training_rule_execution_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rule_id BIGINT UNSIGNED NOT NULL,
  training_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  completion_history_id BIGINT UNSIGNED NULL,
  certification_id BIGINT UNSIGNED NULL,
  result_status ENUM('awarded','progressed','completed_probation','skipped','failed') NOT NULL,
  detail VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_training_rule_log_user (user_id,created_at),
  KEY idx_training_rule_log_training (training_id,created_at),
  CONSTRAINT fk_training_rule_log_rule FOREIGN KEY (rule_id) REFERENCES training_certification_rules(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_rule_log_training FOREIGN KEY (training_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_rule_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_training_rule_log_completion FOREIGN KEY (completion_history_id) REFERENCES training_completion_history(id) ON DELETE SET NULL,
  CONSTRAINT fk_training_rule_log_certification FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
