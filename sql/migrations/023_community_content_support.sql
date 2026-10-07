-- CommunityHub CMS: news, rules and private support conversations.
-- Run after 022. HeidiSQL / MariaDB 10.4 compatible; safe to re-run.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS community_news (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, title VARCHAR(180) NOT NULL,
 category VARCHAR(80) NOT NULL DEFAULT 'News', tags VARCHAR(300) NULL,
 summary VARCHAR(500) NOT NULL, body MEDIUMTEXT NOT NULL,
 status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
 published_at DATETIME NULL, updated_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(id), KEY idx_community_news_public(status,published_at),
 CONSTRAINT fk_community_news_editor FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS community_rules (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, category VARCHAR(80) NOT NULL,
 title VARCHAR(180) NOT NULL, body TEXT NOT NULL, sort_order INT UNSIGNED NOT NULL DEFAULT 0,
 status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft', updated_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(id), KEY idx_community_rules_public(status,category,sort_order),
 CONSTRAINT fk_community_rules_editor FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS support_tickets (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL,
 category ENUM('question','bug','report','appeal') NOT NULL DEFAULT 'question',
 subject VARCHAR(180) NOT NULL,
 status ENUM('open','waiting_on_member','resolved','closed') NOT NULL DEFAULT 'open',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(id), KEY idx_support_owner(user_id,updated_at), KEY idx_support_queue(status,updated_at),
 CONSTRAINT fk_support_ticket_owner FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS support_messages (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ticket_id BIGINT UNSIGNED NOT NULL,
 user_id BIGINT UNSIGNED NULL, is_staff TINYINT(1) NOT NULL DEFAULT 0,
 message TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(id), KEY idx_support_thread(ticket_id,id),
 CONSTRAINT fk_support_message_ticket FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
 CONSTRAINT fk_support_message_author FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
