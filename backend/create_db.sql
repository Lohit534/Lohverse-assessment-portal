-- Run this in MySQL 5.5 to create the database
-- mysql -u root -p < create_db.sql

CREATE DATABASE IF NOT EXISTS lohverse_db
  CHARACTER SET utf8
  COLLATE utf8_general_ci;

USE lohverse_db;

-- Tables are auto-created by SQLAlchemy on first Flask startup.
-- This file just ensures the DB exists with the correct charset.

SELECT 'lohverse_db created successfully' AS status;
