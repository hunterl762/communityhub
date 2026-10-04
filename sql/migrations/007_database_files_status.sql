-- Apply after migrations 005 and 006 in the configured Community Hub database.
CREATE TABLE IF NOT EXISTS document_contents (
  document_id BIGINT UNSIGNED PRIMARY KEY,
  file_data LONGBLOB NOT NULL,
  sha256 CHAR(64) NOT NULL,
  stored_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fivem_status_periods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT UNSIGNED NOT NULL,
  state ENUM('online','offline') NOT NULL,
  started_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NULL,
  open_marker TINYINT NULL DEFAULT 1,
  UNIQUE KEY one_open_period(server_id,open_marker),
  INDEX status_history(server_id,started_at),
  FOREIGN KEY (server_id) REFERENCES fivem_servers(id) ON DELETE CASCADE
);
