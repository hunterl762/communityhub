-- MariaDB 10.4 / HeidiSQL compatible. Notification delivery and deduplication commit together.
CREATE TABLE IF NOT EXISTS lms_reminder_deliveries (
 reminder_key CHAR(64) NOT NULL,
 user_id BIGINT UNSIGNED NOT NULL,
 kind ENUM('training','certification') NOT NULL,
 source_id BIGINT UNSIGNED NOT NULL,
 period_key VARCHAR(100) NOT NULL,
 sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(reminder_key), KEY idx_lms_reminder_history(sent_at,user_id),
 CONSTRAINT fk_lms_reminder_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
