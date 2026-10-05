-- CommunityHub V3 - LOA approval and activity exemption lifecycle
-- HeidiSQL / MariaDB 10.4 compatible migration.
-- Run after 018_staff_activity_tracking.sql with the CommunityHub database selected.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE loa_requests ADD COLUMN reviewed_by BIGINT UNSIGNED NULL AFTER status;
ALTER TABLE loa_requests ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by;
ALTER TABLE loa_requests ADD COLUMN review_notes VARCHAR(500) NULL AFTER reviewed_at;
ALTER TABLE loa_requests ADD COLUMN previous_member_status VARCHAR(32) NULL AFTER review_notes;
ALTER TABLE loa_requests ADD COLUMN previous_activity_status VARCHAR(32) NULL AFTER previous_member_status;
ALTER TABLE loa_requests ADD COLUMN activity_exempted TINYINT(1) NOT NULL DEFAULT 0 AFTER previous_activity_status;
ALTER TABLE loa_requests ADD COLUMN restored_at DATETIME NULL AFTER activity_exempted;
ALTER TABLE loa_requests ADD KEY idx_loa_review_queue (status,start_date,end_date);
ALTER TABLE loa_requests ADD KEY idx_loa_restore (status,end_date,restored_at);
ALTER TABLE loa_requests ADD CONSTRAINT fk_loa_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS loa_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loa_request_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status VARCHAR(32) NOT NULL,
  note VARCHAR(500) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_loa_history_request (loa_request_id,created_at),
  KEY idx_loa_history_user (user_id,created_at),
  CONSTRAINT fk_loa_history_request FOREIGN KEY (loa_request_id) REFERENCES loa_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_loa_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_loa_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
