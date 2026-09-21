-- CREATE TABLE student (
--   reg_no VARCHAR(20) PRIMARY KEY,
--   student_name VARCHAR(100) NOT NULL
-- );

-- CREATE TABLE entry (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   reg_no VARCHAR(20) NOT NULL,
--   system_no VARCHAR(20) NOT NULL,
--   in_time DATETIME NOT NULL,
--   out_time DATETIME NULL,
--   total_time VARCHAR(20) NULL,
--   Date_ DATE NOT NULL,
--   FOREIGN KEY (reg_no) REFERENCES student(reg_no)
-- );




CREATE DATABASE IF NOT EXISTS attendance;
USE attendance;

-- STUDENT TABLE
CREATE TABLE student (
    reg_no VARCHAR(20) PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL
);

-- ENTRY TABLE
CREATE TABLE entry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reg_no VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    system_no VARCHAR(10) NOT NULL,
    in_time DATETIME NOT NULL,
    out_time DATETIME NULL DEFAULT NULL,
    total_time TIME NULL DEFAULT NULL,
    Date_ DATE NOT NULL,
    
    FOREIGN KEY (reg_no) REFERENCES student(reg_no)
);

