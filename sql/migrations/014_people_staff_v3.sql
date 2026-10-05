-- CommunityHub V3 People / Staff lifecycle additions
-- Additive migration: preserves existing users, LOA, discipline, certifications and recruit pipeline data.

CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  probation_status ENUM('none','active','completed','extended') NOT NULL DEFAULT 'none',
  probation_started_at DATETIME NULL,
  probation_ends_at DATETIME NULL,
  activity_status ENUM('active','watch','inactive','exempt') NOT NULL DEFAULT 'active',
  activity_requirement_minutes INT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_staff_profiles_activity (activity_status),
  CONSTRAINT fk_staff_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_profiles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_actions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  action_type ENUM('appointment','promotion','demotion','transfer','probation_start','probation_complete','probation_extend','loa_start','loa_end','separation','reinstatement') NOT NULL,
  from_department_id BIGINT UNSIGNED NULL,
  to_department_id BIGINT UNSIGNED NULL,
  from_rank VARCHAR(120) NULL,
  to_rank VARCHAR(120) NULL,
  reason VARCHAR(500) NULL,
  performed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_staff_actions_user_created (user_id,created_at),
  KEY idx_staff_actions_type_created (action_type,created_at),
  CONSTRAINT fk_staff_actions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_actions_from_department FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_staff_actions_to_department FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_staff_actions_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  note_type ENUM('general','supervisor','performance','commendation','concern') NOT NULL DEFAULT 'general',
  note_text TEXT NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_staff_notes_user_created (user_id,created_at),
  CONSTRAINT fk_staff_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_notes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_evaluations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NULL,
  evaluation_type ENUM('probation','routine','promotion','training','performance') NOT NULL DEFAULT 'routine',
  rating TINYINT UNSIGNED NULL,
  summary TEXT NOT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_staff_evaluations_user_created (user_id,created_at),
  CONSTRAINT fk_staff_evaluations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_evaluations_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_staff_evaluations_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
