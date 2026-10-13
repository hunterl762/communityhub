-- CommunityHub: encrypted Discord sign-in tokens for membership checks.
-- Additive; HeidiSQL / MariaDB 10.4 compatible.
CREATE TABLE IF NOT EXISTS discord_membership_tokens (
 user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 client_id VARCHAR(20) NOT NULL,
 token_cipher MEDIUMTEXT NOT NULL,
 expires_at DATETIME NOT NULL,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_discord_membership_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
