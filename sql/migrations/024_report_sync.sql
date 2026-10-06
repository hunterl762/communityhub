-- Run after 023. MariaDB 10.4 / HeidiSQL compatible; preserves existing reports.
-- Stop report writes while applying this migration, then deploy the new backend.
SET NAMES utf8mb4;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS fivem_report_id BIGINT UNSIGNED NULL;
ALTER TABLE reports ADD UNIQUE INDEX IF NOT EXISTS uq_reports_fivem_report(fivem_report_id);
ALTER TABLE fivem_reports MODIFY COLUMN status ENUM('open','under_review','actioned','dismissed','closed') NOT NULL DEFAULT 'open';
INSERT INTO reports(reporter_user_id,report_type,description,status,assigned_to,created_at,fivem_report_id)
SELECT f.reporter_user_id,f.report_type,
 CONCAT('In-game report: ',f.subject,'\n\n',f.details,'\n\nServer: ',COALESCE(s.name,'Unknown'), '\nPostal: ',COALESCE(f.postal_code,'Unavailable')),
 f.status,f.assigned_to,f.created_at,f.id
FROM fivem_reports f LEFT JOIN fivem_servers s ON s.id=f.server_id
LEFT JOIN reports r ON r.fivem_report_id=f.id WHERE r.id IS NULL;
