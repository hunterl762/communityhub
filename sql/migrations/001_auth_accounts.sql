USE communityhub;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_username VARCHAR(100) NULL AFTER discord_id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER password_hash;
-- Existing installations may already have duplicate/null emails. Review duplicates before adding a unique index.
SET @email_index_exists=(SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='users' AND index_name='uq_users_email');
SET @sql=IF(@email_index_exists=0,'CREATE UNIQUE INDEX uq_users_email ON users(email)','SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;