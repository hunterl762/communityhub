-- Apply after migration 008 in the configured Community Hub database.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by BIGINT UNSIGNED NULL;
