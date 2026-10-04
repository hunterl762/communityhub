-- Apply after 007 in the configured database (same MariaDB syntax as 005/006).
ALTER TABLE fivem_servers ADD COLUMN IF NOT EXISTS game_hours TINYINT UNSIGNED NULL;
ALTER TABLE fivem_servers ADD COLUMN IF NOT EXISTS game_minutes TINYINT UNSIGNED NULL;
ALTER TABLE fivem_servers ADD COLUMN IF NOT EXISTS game_clock_at DATETIME NULL;
CREATE TABLE IF NOT EXISTS patrol_clock_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patrol_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('clock_in','clock_out') NOT NULL,
  source ENUM('web','game') NOT NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(patrol_id) REFERENCES patrol_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX(user_id,occurred_at)
);
CREATE TABLE IF NOT EXISTS fivem_admin_chat (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  message VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(server_id) REFERENCES fivem_servers(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX(server_id,id),INDEX(user_id,created_at)
);
