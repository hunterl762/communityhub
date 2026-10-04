USE communityhub;
ALTER TABLE users MODIFY COLUMN role ENUM('applicant','recruit','member','reviewer','department_command','staff','admin','management','owner') NOT NULL DEFAULT 'applicant';
CREATE TABLE IF NOT EXISTS training_sessions(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 department_id BIGINT UNSIGNED NULL,
 title VARCHAR(180) NOT NULL,
 description TEXT,
 location VARCHAR(255),
 start_at DATETIME NOT NULL,
 end_at DATETIME NULL,
 instructor_seats INT UNSIGNED NOT NULL DEFAULT 2,
 student_seats INT UNSIGNED NOT NULL DEFAULT 10,
 registration_open BOOLEAN NOT NULL DEFAULT TRUE,
 created_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
 INDEX(start_at)
);
CREATE TABLE IF NOT EXISTS training_registrations(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 training_id BIGINT UNSIGNED NOT NULL,
 user_id BIGINT UNSIGNED NOT NULL,
 registration_type ENUM('student','instructor') NOT NULL DEFAULT 'student',
 status ENUM('registered','attended','no_show','cancelled') NOT NULL DEFAULT 'registered',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_training_user(training_id,user_id),
 FOREIGN KEY(training_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO site_settings(setting_key,setting_value) VALUES('community_name','Community Hub') ON DUPLICATE KEY UPDATE setting_key=setting_key;