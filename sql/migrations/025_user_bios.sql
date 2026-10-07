-- MariaDB 10.4 / HeidiSQL compatible. Safe to run again; preserves user records.
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(1000) NOT NULL DEFAULT '';
