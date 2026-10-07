-- PHP runtime metadata only. MariaDB 10.4 / HeidiSQL compatible; existing data is preserved.
CREATE TABLE IF NOT EXISTS php_sessions (
 sid VARCHAR(128) NOT NULL PRIMARY KEY,
 data MEDIUMTEXT NOT NULL,
 expires_at DATETIME NOT NULL,
 KEY idx_php_session_expiry(expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS php_rate_limits (
 bucket CHAR(64) NOT NULL PRIMARY KEY,
 request_count INT UNSIGNED NOT NULL DEFAULT 0,
 expires_at DATETIME NOT NULL,
 KEY idx_php_rate_expiry(expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
