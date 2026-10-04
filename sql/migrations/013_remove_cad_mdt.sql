-- Retain historic call/CAD rows. The feature routes and UI have been removed.
INSERT INTO site_settings(setting_key,setting_value) VALUES('tablet_dispatch_enabled','0'),('tablet_cad_enabled','0'),('tablet_panic_enabled','0') ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
