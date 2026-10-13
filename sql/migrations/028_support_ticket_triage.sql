-- MariaDB 10.4 / HeidiSQL. Existing tickets default to normal and unassigned.
CREATE TABLE IF NOT EXISTS support_ticket_triage (
 ticket_id BIGINT UNSIGNED NOT NULL,
 assigned_to BIGINT UNSIGNED NULL,
 priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
 PRIMARY KEY(ticket_id), KEY idx_support_assignee(assigned_to),
 CONSTRAINT fk_support_triage_ticket FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
 CONSTRAINT fk_support_triage_assignee FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
