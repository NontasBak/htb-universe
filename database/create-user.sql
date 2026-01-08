-- HTB Universe - MySQL User Setup Script
-- Run this ONLY if you don't have a MySQL user set up yet
-- Usage: sudo mysql < database/setup-database.sql

CREATE USER IF NOT EXISTS 'db_admin'@'localhost' IDENTIFIED BY 'admin_pass';
GRANT ALL PRIVILEGES ON htb_universe.* TO 'db_admin'@'localhost';
GRANT CREATE ON *.* TO 'db_admin'@'localhost';
FLUSH PRIVILEGES;
