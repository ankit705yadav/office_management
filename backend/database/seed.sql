-- Seed Data for Operation Management System
-- This script populates the database with initial test data

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE task_attachments CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE daily_reports CASCADE;
TRUNCATE TABLE attendance_regularizations CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE attendance_settings CASCADE;
TRUNCATE TABLE leave_approvals CASCADE;
TRUNCATE TABLE leave_requests CASCADE;
TRUNCATE TABLE leave_balances CASCADE;
TRUNCATE TABLE holidays CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE departments CASCADE;

-- Reset sequences
ALTER SEQUENCE departments_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE holidays_id_seq RESTART WITH 1;
ALTER SEQUENCE leave_balances_id_seq RESTART WITH 1;
ALTER SEQUENCE leave_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE leave_approvals_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_regularizations_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_reports_id_seq RESTART WITH 1;
ALTER SEQUENCE clients_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_attachments_id_seq RESTART WITH 1;

-- =====================================================
-- DEPARTMENTS
-- =====================================================
INSERT INTO departments (name, description, created_at, updated_at) VALUES
('Engineering', 'Software Development and IT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Human Resources', 'HR and People Operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sales', 'Sales and Business Development', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Marketing', 'Marketing and Communications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Finance', 'Finance and Accounting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- USERS
-- Password for all users: Password@123
-- Hash: $2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.
-- =====================================================

-- Admin (ID: 1) - Birthday in January
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, created_at, updated_at) VALUES
('admin@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'System', 'Administrator', '+91-9876543210', '1985-01-15', '2020-01-01', 'admin', 'active', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Managers (IDs: 2-6) - Some with January birthdays
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, created_at, updated_at) VALUES
('john.manager@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'John', 'Smith', '+91-9876543211', '1988-01-22', '2020-06-01', 'manager', 'active', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sarah.hr@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Sarah', 'Johnson', '+91-9876543212', '1987-01-28', '2020-03-15', 'manager', 'active', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mike.sales@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Mike', 'Wilson', '+91-9876543213', '1989-11-25', '2021-01-10', 'manager', 'active', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lisa.marketing@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Lisa', 'Brown', '+91-9876543214', '1990-05-18', '2021-04-01', 'manager', 'active', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('david.finance@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'David', 'Lee', '+91-9876543215', '1986-09-30', '2020-08-01', 'manager', 'active', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Employees (IDs: 7-20) - Some with January birthdays
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, created_at, updated_at) VALUES
-- Engineering Team
('alice.dev@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Alice', 'Anderson', '+91-9876543220', '1995-01-25', '2022-01-15', 'employee', 'active', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bob.dev@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Bob', 'Baker', '+91-9876543221', '1994-01-30', '2022-03-01', 'employee', 'active', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('carol.dev@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Carol', 'Chen', '+91-9876543222', '1996-08-05', '2023-01-10', 'employee', 'active', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dan.dev@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Dan', 'Davis', '+91-9876543223', '1993-12-18', '2021-09-01', 'employee', 'active', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- HR Team
('emma.hr@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Emma', 'Evans', '+91-9876543224', '1992-04-11', '2021-06-15', 'employee', 'active', 2, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('frank.hr@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Frank', 'Fisher', '+91-9876543225', '1991-10-09', '2022-02-01', 'employee', 'active', 2, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Sales Team
('grace.sales@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Grace', 'Garcia', '+91-9876543226', '1994-03-27', '2022-05-01', 'employee', 'active', 3, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('henry.sales@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Henry', 'Harris', '+91-9876543227', '1993-07-16', '2021-11-15', 'employee', 'active', 3, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('iris.sales@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Iris', 'Irwin', '+91-9876543228', '1995-01-30', '2023-02-01', 'employee', 'active', 3, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Marketing Team
('jack.marketing@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Jack', 'Jackson', '+91-9876543229', '1992-11-08', '2022-07-01', 'employee', 'active', 4, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kate.marketing@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Kate', 'King', '+91-9876543230', '1994-05-23', '2023-03-15', 'employee', 'active', 4, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Finance Team
('liam.finance@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Liam', 'Lewis', '+91-9876543231', '1991-09-12', '2021-10-01', 'employee', 'active', 5, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('maria.finance@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Maria', 'Martinez', '+91-9876543232', '1993-02-19', '2022-06-01', 'employee', 'active', 5, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('nina.finance@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Nina', 'Nelson', '+91-9876543233', '1995-08-07', '2023-04-01', 'employee', 'active', 5, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- CLIENTS
-- =====================================================
INSERT INTO clients (name, email, phone, address, website, contact_person, notes, status, created_by, created_at, updated_at) VALUES
-- Technology Clients
('TechCorp Solutions', 'contact@techcorp.com', '+91-11-4567890', '123 Tech Park, Bangalore 560001', 'www.techcorp.com', 'Rajesh Kumar', 'Enterprise software solutions client. Ongoing support contract.', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('InnovateTech Pvt Ltd', 'info@innovatetech.in', '+91-22-5678901', '456 Innovation Hub, Mumbai 400001', 'www.innovatetech.in', 'Priya Sharma', 'Startup client focused on AI/ML solutions. Great potential for growth.', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('CloudNine Services', 'business@cloudnine.io', '+91-80-6789012', '789 Cloud Tower, Hyderabad 500032', 'www.cloudnine.io', 'Amit Patel', 'Cloud migration and infrastructure client.', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Retail & E-commerce Clients
('ShopEasy Retail', 'partnerships@shopeasy.com', '+91-44-7890123', '321 Commerce Street, Chennai 600001', 'www.shopeasy.com', 'Sunita Reddy', 'E-commerce platform development. Phase 2 in progress.', 'active', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FreshMart Groceries', 'tech@freshmart.in', '+91-33-8901234', '654 Market Plaza, Kolkata 700001', 'www.freshmart.in', 'Vikram Singh', 'Inventory management system implementation.', 'active', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Financial Services Clients
('FinanceFirst Bank', 'it@financefirst.com', '+91-11-9012345', '100 Banking Tower, New Delhi 110001', 'www.financefirst.com', 'Ananya Gupta', 'Core banking software maintenance. Critical client - priority support.', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SecureInvest Capital', 'operations@secureinvest.in', '+91-22-0123456', '200 Investment House, Mumbai 400021', 'www.secureinvest.in', 'Rahul Mehta', 'Trading platform development. Compliance requirements strict.', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Healthcare Clients
('HealthPlus Hospitals', 'it@healthplus.org', '+91-80-1234567', '50 Medical Campus, Bangalore 560010', 'www.healthplus.org', 'Dr. Kavitha Rao', 'Hospital management system. HIPAA compliance required.', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('MediCare Diagnostics', 'tech@medicare-diag.com', '+91-40-2345678', '75 Diagnostic Center, Hyderabad 500034', 'www.medicare-diag.com', 'Dr. Suresh Nair', 'Lab information management system.', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Manufacturing Clients
('SteelWorks Industries', 'admin@steelworks.com', '+91-657-3456789', '1 Industrial Area, Jamshedpur 831001', 'www.steelworks.com', 'Manoj Tiwari', 'ERP implementation project. On hold due to budget review.', 'inactive', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AutoParts Manufacturing', 'info@autoparts-mfg.in', '+91-141-4567890', '25 RIICO Industrial, Jaipur 302022', 'www.autoparts-mfg.in', 'Deepak Joshi', 'Supply chain management system.', 'active', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Education Clients
('LearnSmart Academy', 'tech@learnsmart.edu.in', '+91-20-5678901', '10 Education Park, Pune 411001', 'www.learnsmart.edu.in', 'Prof. Sneha Kulkarni', 'Learning management system development.', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Inactive/Past Clients
('OldTech Systems', 'contact@oldtech.com', '+91-11-6789012', '999 Legacy Building, Delhi 110002', NULL, 'Ramesh Agarwal', 'Legacy system - contract ended in 2024.', 'inactive', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- HOLIDAYS (2025 and 2026)
-- =====================================================
INSERT INTO holidays (name, date, description, year, is_optional, created_at, updated_at) VALUES
-- 2025 Holidays
('New Year', '2025-01-01', 'New Year Day', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Republic Day', '2025-01-26', 'Republic Day of India', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Holi', '2025-03-14', 'Festival of Colors', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Eid ul-Fitr', '2025-04-01', 'End of Ramadan', 2025, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Good Friday', '2025-04-18', 'Good Friday', 2025, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Independence Day', '2025-08-15', 'Independence Day of India', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Janmashtami', '2025-08-16', 'Birth of Lord Krishna', 2025, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Gandhi Jayanti', '2025-10-02', 'Birth Anniversary of Mahatma Gandhi', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Dussehra', '2025-10-02', 'Victory of Good over Evil', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Diwali', '2025-10-20', 'Festival of Lights', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Christmas', '2025-12-25', 'Christmas Day', 2025, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 2026 Holidays
('New Year', '2026-01-01', 'New Year Day', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Republic Day', '2026-01-26', 'Republic Day of India', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Holi', '2026-03-04', 'Festival of Colors', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Eid ul-Fitr', '2026-03-21', 'End of Ramadan', 2026, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Good Friday', '2026-04-03', 'Good Friday', 2026, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Independence Day', '2026-08-15', 'Independence Day of India', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Janmashtami', '2026-08-25', 'Birth of Lord Krishna', 2026, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Gandhi Jayanti', '2026-10-02', 'Birth Anniversary of Mahatma Gandhi', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Dussehra', '2026-10-19', 'Victory of Good over Evil', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Diwali', '2026-11-08', 'Festival of Lights', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Christmas', '2026-12-25', 'Christmas Day', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- LEAVE BALANCES (All users - 2025 and 2026)
-- =====================================================
-- 2025 Leave Balances (with realistic used values)
INSERT INTO leave_balances (user_id, year, casual_leave, sick_leave, earned_leave, comp_off, paternity_maternity, birthday_leave, created_at, updated_at)
SELECT
    id as user_id,
    2025 as year,
    12.0 as casual_leave,
    12.0 as sick_leave,
    15.0 as earned_leave,
    0.0 as comp_off,
    CASE WHEN id IN (7, 11) THEN 15.0 ELSE 0.0 END as paternity_maternity,
    1.0 as birthday_leave,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users WHERE status = 'active';

-- 2026 Leave Balances (fresh allocation)
INSERT INTO leave_balances (user_id, year, casual_leave, sick_leave, earned_leave, comp_off, paternity_maternity, birthday_leave, created_at, updated_at)
SELECT
    id as user_id,
    2026 as year,
    12.0 as casual_leave,
    12.0 as sick_leave,
    15.0 as earned_leave,
    0.0 as comp_off,
    CASE WHEN id IN (7, 11) THEN 15.0 ELSE 0.0 END as paternity_maternity,
    1.0 as birthday_leave,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users WHERE status = 'active';

-- =====================================================
-- LEAVE REQUESTS (Comprehensive sample data)
-- =====================================================
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, approver_id, approved_rejected_at, comments, is_half_day, half_day_session, document_url, current_approval_level, total_approval_levels, created_at, updated_at) VALUES
-- ==================== APPROVED LEAVES ====================

-- Alice (User 7) - Engineering - Multiple approved leaves
(7, 'casual', '2025-01-20', '2025-01-21', 2, 'Family wedding ceremony in hometown. Need to travel early.', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '85 days', 'Approved. Ensure handover is done.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '85 days'),
(7, 'sick', '2025-03-10', '2025-03-11', 2, 'Fever and cold. Doctor advised rest.', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '40 days', 'Get well soon. Take rest.', false, NULL, 'https://docs.company.com/medical/alice-march-2025.pdf', 1, 1, CURRENT_TIMESTAMP - INTERVAL '42 days', CURRENT_TIMESTAMP - INTERVAL '40 days'),
(7, 'casual', '2025-04-18', '2025-04-18', 0.5, 'Bank work - need to visit branch for loan documentation', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '25 days', 'Approved for morning half', true, 'morning', NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '28 days', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(7, 'birthday', '2025-01-25', '2025-01-25', 1, 'Birthday leave', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '92 days', 'Happy Birthday! Enjoy your day.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP - INTERVAL '92 days'),

-- Bob (User 8) - Engineering - Approved leaves
(8, 'sick', '2025-02-05', '2025-02-07', 3, 'Viral infection. Doctor prescribed 3 days rest.', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '60 days', 'Approved. Provide medical certificate when you return.', false, NULL, 'https://docs.company.com/medical/bob-feb-2025.pdf', 1, 1, CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP - INTERVAL '60 days'),
(8, 'casual', '2025-03-28', '2025-03-28', 1, 'Personal work - passport renewal', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '30 days', 'Approved', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(8, 'birthday', '2025-01-30', '2025-01-30', 1, 'Birthday leave', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '88 days', 'Happy Birthday!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '88 days'),

-- Carol (User 9) - Engineering - Approved leaves
(9, 'casual', '2025-02-14', '2025-02-14', 1, 'Valentine day celebration with family', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '55 days', 'Enjoy!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '55 days'),
(9, 'earned', '2025-04-01', '2025-04-04', 4, 'Family vacation to Goa. Planned trip.', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '20 days', 'Approved. Have a great vacation!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- Dan (User 10) - Engineering
(10, 'sick', '2025-01-15', '2025-01-15', 1, 'Migraine - need rest', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '95 days', 'Take care', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '97 days', CURRENT_TIMESTAMP - INTERVAL '95 days'),
(10, 'casual', '2025-03-05', '2025-03-05', 0.5, 'Dentist appointment', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '45 days', 'Approved for afternoon', true, 'afternoon', NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP - INTERVAL '45 days'),

-- Emma (User 11) - HR
(11, 'earned', '2025-02-20', '2025-02-24', 3, 'Family trip to Kerala - visiting relatives', 'approved', 3, CURRENT_TIMESTAMP - INTERVAL '50 days', 'Approved. Enjoy your trip!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '50 days'),
(11, 'casual', '2025-04-10', '2025-04-11', 2, 'House shifting to new apartment', 'approved', 3, CURRENT_TIMESTAMP - INTERVAL '15 days', 'Approved. Good luck with the move!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),

-- Frank (User 12) - HR
(12, 'sick', '2025-03-15', '2025-03-17', 3, 'Food poisoning - hospitalized', 'approved', 3, CURRENT_TIMESTAMP - INTERVAL '35 days', 'Get well soon. Rest properly.', false, NULL, 'https://docs.company.com/medical/frank-march-2025.pdf', 1, 1, CURRENT_TIMESTAMP - INTERVAL '38 days', CURRENT_TIMESTAMP - INTERVAL '35 days'),

-- Grace (User 13) - Sales
(13, 'casual', '2025-01-10', '2025-01-10', 1, 'Attending a family function', 'approved', 4, CURRENT_TIMESTAMP - INTERVAL '100 days', 'Approved', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '105 days', CURRENT_TIMESTAMP - INTERVAL '100 days'),
(13, 'earned', '2025-03-20', '2025-03-21', 2, 'Short trip to Jaipur', 'approved', 4, CURRENT_TIMESTAMP - INTERVAL '32 days', 'Approved. Have fun!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '32 days'),

-- Henry (User 14) - Sales
(14, 'casual', '2025-02-28', '2025-02-28', 0.5, 'Vehicle service appointment', 'approved', 4, CURRENT_TIMESTAMP - INTERVAL '48 days', 'Approved for morning', true, 'morning', NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '52 days', CURRENT_TIMESTAMP - INTERVAL '48 days'),
(14, 'sick', '2025-04-05', '2025-04-05', 1, 'Not feeling well - stomach upset', 'approved', 4, CURRENT_TIMESTAMP - INTERVAL '18 days', 'Take rest', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '18 days'),

-- Iris (User 15) - Sales
(15, 'birthday', '2025-01-30', '2025-01-30', 1, 'Birthday leave', 'approved', 4, CURRENT_TIMESTAMP - INTERVAL '88 days', 'Happy Birthday! Enjoy!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '88 days'),

-- Jack (User 16) - Marketing
(16, 'casual', '2025-03-12', '2025-03-12', 1, 'Personal work', 'approved', 5, CURRENT_TIMESTAMP - INTERVAL '38 days', 'Approved', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '42 days', CURRENT_TIMESTAMP - INTERVAL '38 days'),

-- Kate (User 17) - Marketing
(17, 'sick', '2025-02-10', '2025-02-11', 2, 'Flu symptoms - need rest', 'approved', 5, CURRENT_TIMESTAMP - INTERVAL '58 days', 'Get well soon', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '62 days', CURRENT_TIMESTAMP - INTERVAL '58 days'),

-- Liam (User 18) - Finance
(18, 'casual', '2025-01-31', '2025-01-31', 1, 'Family emergency', 'approved', 6, CURRENT_TIMESTAMP - INTERVAL '86 days', 'Approved. Take care.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '87 days', CURRENT_TIMESTAMP - INTERVAL '86 days'),
(18, 'earned', '2025-03-25', '2025-03-28', 4, 'Planned vacation to Shimla', 'approved', 6, CURRENT_TIMESTAMP - INTERVAL '28 days', 'Enjoy your vacation!', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP - INTERVAL '28 days'),

-- Maria (User 19) - Finance
(19, 'sick', '2025-04-02', '2025-04-02', 1, 'Headache and body pain', 'approved', 6, CURRENT_TIMESTAMP - INTERVAL '20 days', 'Take rest', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '22 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- Nina (User 20) - Finance
(20, 'casual', '2025-02-17', '2025-02-17', 0.5, 'Bank work', 'approved', 6, CURRENT_TIMESTAMP - INTERVAL '52 days', 'Approved for afternoon half', true, 'afternoon', NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '52 days'),

-- ==================== PENDING LEAVES ====================

-- Pending leaves for current/upcoming dates
(7, 'casual', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', 0.5, 'Doctor follow-up appointment in the morning', 'pending', NULL, NULL, NULL, true, 'morning', NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(8, 'earned', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '19 days', 5, 'Family vacation - annual trip to native place', 'pending', NULL, NULL, NULL, false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(9, 'casual', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days', 2, 'Sister''s engagement ceremony', 'pending', NULL, NULL, NULL, false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(13, 'casual', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days', 1, 'Personal work - house registration', 'pending', NULL, NULL, NULL, false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(16, 'earned', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '24 days', 5, 'Planned trip to Manali with family', 'pending', NULL, NULL, NULL, false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(18, 'casual', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 1, 'Child''s school annual day function', 'pending', NULL, NULL, NULL, false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- ==================== REJECTED LEAVES ====================

-- Rejected leaves with reasons
(10, 'casual', '2025-01-26', '2025-01-27', 2, 'Personal trip', 'rejected', 2, CURRENT_TIMESTAMP - INTERVAL '92 days', 'Rejected - Republic Day is a critical deployment day. Please reschedule.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP - INTERVAL '92 days'),
(12, 'earned', '2025-03-31', '2025-04-04', 5, 'Long vacation planned', 'rejected', 3, CURRENT_TIMESTAMP - INTERVAL '22 days', 'Rejected - Quarter end is a busy period for HR. Please apply for different dates.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '22 days'),
(14, 'casual', '2025-02-14', '2025-02-14', 1, 'Valentine day', 'rejected', 4, CURRENT_TIMESTAMP - INTERVAL '55 days', 'Rejected - Important client meeting scheduled. Please plan accordingly.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '55 days'),
(19, 'earned', '2025-03-15', '2025-03-20', 4, 'Family vacation', 'rejected', 6, CURRENT_TIMESTAMP - INTERVAL '40 days', 'Rejected - Month-end closing. Finance team needed. Try next month.', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '40 days'),

-- ==================== CANCELLED LEAVES ====================

-- Cancelled leaves by employees
(7, 'casual', '2025-04-25', '2025-04-25', 1, 'Personal work', 'cancelled', NULL, NULL, 'Cancelled by employee - plans changed', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(11, 'earned', '2025-05-01', '2025-05-05', 3, 'Trip to Mumbai', 'cancelled', NULL, NULL, 'Cancelled by employee - postponing trip', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(15, 'casual', '2025-04-15', '2025-04-15', 1, 'Personal work', 'cancelled', NULL, NULL, 'Cancelled - work done remotely', false, NULL, NULL, 1, 1, CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP - INTERVAL '16 days');

-- =====================================================
-- LEAVE APPROVALS (For multi-level approval tracking)
-- =====================================================
INSERT INTO leave_approvals (leave_request_id, approver_id, approval_order, status, comments, acted_at, created_at, updated_at) VALUES
-- Approved leave approvals
(1, 2, 1, 'approved', 'Approved. Ensure handover is done.', CURRENT_TIMESTAMP - INTERVAL '85 days', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '85 days'),
(2, 2, 1, 'approved', 'Get well soon. Take rest.', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '42 days', CURRENT_TIMESTAMP - INTERVAL '40 days'),
(3, 2, 1, 'approved', 'Approved for morning half', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '28 days', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(4, 2, 1, 'approved', 'Happy Birthday! Enjoy your day.', CURRENT_TIMESTAMP - INTERVAL '92 days', CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP - INTERVAL '92 days'),
(5, 2, 1, 'approved', 'Approved. Provide medical certificate when you return.', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP - INTERVAL '60 days'),
(6, 2, 1, 'approved', 'Approved', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(7, 2, 1, 'approved', 'Happy Birthday!', CURRENT_TIMESTAMP - INTERVAL '88 days', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '88 days'),
(8, 2, 1, 'approved', 'Enjoy!', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '55 days'),
(9, 2, 1, 'approved', 'Approved. Have a great vacation!', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(10, 2, 1, 'approved', 'Take care', CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP - INTERVAL '97 days', CURRENT_TIMESTAMP - INTERVAL '95 days'),
(11, 2, 1, 'approved', 'Approved for afternoon', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(12, 3, 1, 'approved', 'Approved. Enjoy your trip!', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '50 days'),
(13, 3, 1, 'approved', 'Approved. Good luck with the move!', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(14, 3, 1, 'approved', 'Get well soon. Rest properly.', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP - INTERVAL '38 days', CURRENT_TIMESTAMP - INTERVAL '35 days'),
(15, 4, 1, 'approved', 'Approved', CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP - INTERVAL '105 days', CURRENT_TIMESTAMP - INTERVAL '100 days'),
(16, 4, 1, 'approved', 'Approved. Have fun!', CURRENT_TIMESTAMP - INTERVAL '32 days', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '32 days'),
(17, 4, 1, 'approved', 'Approved for morning', CURRENT_TIMESTAMP - INTERVAL '48 days', CURRENT_TIMESTAMP - INTERVAL '52 days', CURRENT_TIMESTAMP - INTERVAL '48 days'),
(18, 4, 1, 'approved', 'Take rest', CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '18 days'),
(19, 4, 1, 'approved', 'Happy Birthday! Enjoy!', CURRENT_TIMESTAMP - INTERVAL '88 days', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '88 days'),
(20, 5, 1, 'approved', 'Approved', CURRENT_TIMESTAMP - INTERVAL '38 days', CURRENT_TIMESTAMP - INTERVAL '42 days', CURRENT_TIMESTAMP - INTERVAL '38 days'),
(21, 5, 1, 'approved', 'Get well soon', CURRENT_TIMESTAMP - INTERVAL '58 days', CURRENT_TIMESTAMP - INTERVAL '62 days', CURRENT_TIMESTAMP - INTERVAL '58 days'),
(22, 6, 1, 'approved', 'Approved. Take care.', CURRENT_TIMESTAMP - INTERVAL '86 days', CURRENT_TIMESTAMP - INTERVAL '87 days', CURRENT_TIMESTAMP - INTERVAL '86 days'),
(23, 6, 1, 'approved', 'Enjoy your vacation!', CURRENT_TIMESTAMP - INTERVAL '28 days', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP - INTERVAL '28 days'),
(24, 6, 1, 'approved', 'Take rest', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '22 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(25, 6, 1, 'approved', 'Approved for afternoon half', CURRENT_TIMESTAMP - INTERVAL '52 days', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '52 days'),

-- Pending leave approvals
(26, 2, 1, 'pending', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(27, 2, 1, 'pending', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(28, 2, 1, 'pending', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(29, 4, 1, 'pending', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(30, 5, 1, 'pending', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(31, 6, 1, 'pending', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Rejected leave approvals
(32, 2, 1, 'rejected', 'Rejected - Republic Day is a critical deployment day. Please reschedule.', CURRENT_TIMESTAMP - INTERVAL '92 days', CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP - INTERVAL '92 days'),
(33, 3, 1, 'rejected', 'Rejected - Quarter end is a busy period for HR. Please apply for different dates.', CURRENT_TIMESTAMP - INTERVAL '22 days', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '22 days'),
(34, 4, 1, 'rejected', 'Rejected - Important client meeting scheduled. Please plan accordingly.', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '55 days'),
(35, 6, 1, 'rejected', 'Rejected - Month-end closing. Finance team needed. Try next month.', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '40 days');

-- =====================================================
-- UPDATE LEAVE BALANCES (Deduct approved leaves)
-- =====================================================
-- Alice (User 7): casual: -2.5, sick: -2, birthday: -1
UPDATE leave_balances SET casual_leave = casual_leave - 2.5, sick_leave = sick_leave - 2, birthday_leave = birthday_leave - 1 WHERE user_id = 7 AND year = 2025;

-- Bob (User 8): sick: -3, casual: -1, birthday: -1
UPDATE leave_balances SET sick_leave = sick_leave - 3, casual_leave = casual_leave - 1, birthday_leave = birthday_leave - 1 WHERE user_id = 8 AND year = 2025;

-- Carol (User 9): casual: -1, earned: -4
UPDATE leave_balances SET casual_leave = casual_leave - 1, earned_leave = earned_leave - 4 WHERE user_id = 9 AND year = 2025;

-- Dan (User 10): sick: -1, casual: -0.5
UPDATE leave_balances SET sick_leave = sick_leave - 1, casual_leave = casual_leave - 0.5 WHERE user_id = 10 AND year = 2025;

-- Emma (User 11): earned: -3, casual: -2
UPDATE leave_balances SET earned_leave = earned_leave - 3, casual_leave = casual_leave - 2 WHERE user_id = 11 AND year = 2025;

-- Frank (User 12): sick: -3
UPDATE leave_balances SET sick_leave = sick_leave - 3 WHERE user_id = 12 AND year = 2025;

-- Grace (User 13): casual: -1, earned: -2
UPDATE leave_balances SET casual_leave = casual_leave - 1, earned_leave = earned_leave - 2 WHERE user_id = 13 AND year = 2025;

-- Henry (User 14): casual: -0.5, sick: -1
UPDATE leave_balances SET casual_leave = casual_leave - 0.5, sick_leave = sick_leave - 1 WHERE user_id = 14 AND year = 2025;

-- Iris (User 15): birthday: -1
UPDATE leave_balances SET birthday_leave = birthday_leave - 1 WHERE user_id = 15 AND year = 2025;

-- Jack (User 16): casual: -1
UPDATE leave_balances SET casual_leave = casual_leave - 1 WHERE user_id = 16 AND year = 2025;

-- Kate (User 17): sick: -2
UPDATE leave_balances SET sick_leave = sick_leave - 2 WHERE user_id = 17 AND year = 2025;

-- Liam (User 18): casual: -1, earned: -4
UPDATE leave_balances SET casual_leave = casual_leave - 1, earned_leave = earned_leave - 4 WHERE user_id = 18 AND year = 2025;

-- Maria (User 19): sick: -1
UPDATE leave_balances SET sick_leave = sick_leave - 1 WHERE user_id = 19 AND year = 2025;

-- Nina (User 20): casual: -0.5
UPDATE leave_balances SET casual_leave = casual_leave - 0.5 WHERE user_id = 20 AND year = 2025;

-- =====================================================
-- ATTENDANCE SETTINGS (Company-wide default)
-- =====================================================
INSERT INTO attendance_settings (department_id, work_start_time, work_end_time, grace_period_minutes, half_day_hours, full_day_hours, working_days, auto_checkout_enabled, auto_checkout_time, location_tracking_enabled, created_at, updated_at) VALUES
(NULL, '09:00:00', '18:00:00', 10, 4.0, 8.0, ARRAY[1,2,3,4,5], false, '18:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Engineering department - flexible hours
INSERT INTO attendance_settings (department_id, work_start_time, work_end_time, grace_period_minutes, half_day_hours, full_day_hours, working_days, auto_checkout_enabled, auto_checkout_time, location_tracking_enabled, created_at, updated_at) VALUES
(1, '10:00:00', '19:00:00', 15, 4.0, 8.0, ARRAY[1,2,3,4,5], false, '19:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- ATTENDANCE RECORDS (Last 10 days for some users)
-- =====================================================
-- Alice (User 7) - Regular attendance
INSERT INTO attendance (user_id, date, check_in_time, check_out_time, check_in_location, check_out_location, status, work_hours, is_late, is_early_departure, created_at, updated_at) VALUES
(7, CURRENT_DATE - 9, CURRENT_TIMESTAMP - INTERVAL '9 days' + TIME '09:05:00', CURRENT_TIMESTAMP - INTERVAL '9 days' + TIME '18:10:00', '28.6139N, 77.2090E', '28.6139N, 77.2090E', 'present', 9.08, false, false, CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(7, CURRENT_DATE - 8, CURRENT_TIMESTAMP - INTERVAL '8 days' + TIME '09:15:00', CURRENT_TIMESTAMP - INTERVAL '8 days' + TIME '18:00:00', '28.6139N, 77.2090E', '28.6139N, 77.2090E', 'late', 8.75, true, false, CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(7, CURRENT_DATE - 7, CURRENT_TIMESTAMP - INTERVAL '7 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '7 days' + TIME '18:05:00', '28.6139N, 77.2090E', '28.6139N, 77.2090E', 'present', 9.08, false, false, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(7, CURRENT_DATE - 4, CURRENT_TIMESTAMP - INTERVAL '4 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '4 days' + TIME '18:00:00', '28.6139N, 77.2090E', '28.6139N, 77.2090E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(7, CURRENT_DATE - 3, CURRENT_TIMESTAMP - INTERVAL '3 days' + TIME '09:20:00', CURRENT_TIMESTAMP - INTERVAL '3 days' + TIME '17:30:00', '28.6139N, 77.2090E', '28.6139N, 77.2090E', 'late', 8.17, true, true, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Bob (User 8) - Some absences
INSERT INTO attendance (user_id, date, check_in_time, check_out_time, check_in_location, check_out_location, status, work_hours, is_late, is_early_departure, created_at, updated_at) VALUES
(8, CURRENT_DATE - 9, CURRENT_TIMESTAMP - INTERVAL '9 days' + TIME '09:10:00', CURRENT_TIMESTAMP - INTERVAL '9 days' + TIME '18:00:00', '28.6140N, 77.2091E', '28.6140N, 77.2091E', 'present', 8.83, false, false, CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(8, CURRENT_DATE - 8, NULL, NULL, NULL, NULL, 'absent', 0, false, false, CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(8, CURRENT_DATE - 7, CURRENT_TIMESTAMP - INTERVAL '7 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '7 days' + TIME '18:00:00', '28.6140N, 77.2091E', '28.6140N, 77.2091E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(8, CURRENT_DATE - 4, CURRENT_TIMESTAMP - INTERVAL '4 days' + TIME '09:05:00', CURRENT_TIMESTAMP - INTERVAL '4 days' + TIME '13:00:00', '28.6140N, 77.2091E', '28.6140N, 77.2091E', 'half_day', 3.92, false, true, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days');

-- Manager (User 2) - Consistent attendance
INSERT INTO attendance (user_id, date, check_in_time, check_out_time, check_in_location, check_out_location, status, work_hours, is_late, is_early_departure, created_at, updated_at) VALUES
(2, CURRENT_DATE - 9, CURRENT_TIMESTAMP - INTERVAL '9 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '9 days' + TIME '18:00:00', '28.6141N, 77.2092E', '28.6141N, 77.2092E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(2, CURRENT_DATE - 8, CURRENT_TIMESTAMP - INTERVAL '8 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '8 days' + TIME '18:00:00', '28.6141N, 77.2092E', '28.6141N, 77.2092E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(2, CURRENT_DATE - 7, CURRENT_TIMESTAMP - INTERVAL '7 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '7 days' + TIME '18:00:00', '28.6141N, 77.2092E', '28.6141N, 77.2092E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(2, CURRENT_DATE - 4, CURRENT_TIMESTAMP - INTERVAL '4 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '4 days' + TIME '18:00:00', '28.6141N, 77.2092E', '28.6141N, 77.2092E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(2, CURRENT_DATE - 3, CURRENT_TIMESTAMP - INTERVAL '3 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '3 days' + TIME '18:00:00', '28.6141N, 77.2092E', '28.6141N, 77.2092E', 'present', 9.0, false, false, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- =====================================================
-- ATTENDANCE REGULARIZATIONS (Sample requests)
-- =====================================================
INSERT INTO attendance_regularizations (user_id, attendance_id, date, requested_check_in, requested_check_out, requested_location, reason, status, approver_id, approved_rejected_at, comments, created_at, updated_at) VALUES
-- Approved regularization
(8, NULL, CURRENT_DATE - 8, CURRENT_TIMESTAMP - INTERVAL '8 days' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '8 days' + TIME '18:00:00', '28.6140N, 77.2091E', 'Forgot to punch in - was in office all day', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '7 days', 'Approved - verified with team', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),

-- Pending regularization
(9, NULL, CURRENT_DATE - 1, CURRENT_TIMESTAMP - INTERVAL '1 day' + TIME '09:00:00', CURRENT_TIMESTAMP - INTERVAL '1 day' + TIME '18:00:00', '28.6142N, 77.2093E', 'System was down, could not check in', 'pending', NULL, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- =====================================================
-- NOTIFICATIONS (Sample)
-- =====================================================
INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES
(7, 'leave_approval', 'Leave Approved', 'Your casual leave request for Nov 10-12 has been approved', true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
(8, 'leave_approval', 'Leave Approved', 'Your sick leave request for Nov 15 has been approved', true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(10, 'leave_rejection', 'Leave Rejected', 'Your leave request for Dec 24-27 has been rejected', false, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(8, 'general', 'Regularization Approved', 'Your attendance regularization for Nov 10 has been approved', true, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(2, 'general', 'New Regularization Request', 'Carol has submitted attendance regularization request', false, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- =====================================================
-- DAILY REPORTS (Sample)
-- =====================================================
INSERT INTO daily_reports (user_id, report_date, title, description, status, submitted_at, created_at, updated_at) VALUES
-- Submitted reports
(7, CURRENT_DATE - 1, 'API Development Progress', 'Worked on implementing the user authentication API endpoints. Completed login, logout, and token refresh endpoints.

Key achievements:
- Implemented JWT-based authentication
- Added rate limiting to prevent brute force attacks
- Wrote unit tests for auth endpoints', 'submitted', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),

(7, CURRENT_DATE - 2, 'Database Schema Design', 'Designed and implemented the database schema for the new inventory management module. Created tables for products, stock movements, and material assignments.', 'submitted', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

(8, CURRENT_DATE - 1, 'Frontend Dashboard Updates', 'Completed the dashboard redesign with new charts and widgets. Added real-time data refresh and improved the overall user experience.

Key tasks:
- Implemented ApexCharts for data visualization
- Added dark mode support
- Fixed responsive layout issues on mobile devices', 'submitted', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),

(8, CURRENT_DATE - 2, 'Bug Fixes and Code Review', 'Fixed several bugs reported by QA team including the login redirect issue and date formatting problems. Also conducted code review for team members.', 'submitted', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Draft report
(9, CURRENT_DATE, 'Daily Standup and Planning', 'Attended the daily standup meeting and sprint planning session. Identified tasks for the week.', 'draft', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- PROJECTS
-- =====================================================
INSERT INTO projects (name, description, owner_id, created_by, department_id, client_id, status, priority, start_date, end_date, budget, project_code, created_at, updated_at) VALUES
-- Active Projects
('Office Management System', 'Internal HR, attendance, and project management platform for the organization. Includes employee self-service, leave management, and reporting.', 2, 1, 1, NULL, 'active', 'high', '2024-11-01', '2025-03-31', 150000.00, 'OMS-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TechCorp ERP Integration', 'Enterprise resource planning system integration for TechCorp Solutions. Includes inventory, procurement, and financial modules.', 2, 1, 1, 1, 'active', 'high', '2024-12-01', '2025-06-30', 500000.00, 'TC-ERP-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('CloudNine Migration', 'Cloud infrastructure migration project for CloudNine Services. Moving on-premise systems to AWS cloud.', 2, 2, 1, 3, 'active', 'medium', '2025-01-15', '2025-05-15', 200000.00, 'CN-MIG-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('InnovateTech AI Platform', 'AI/ML platform development for InnovateTech. Includes model training infrastructure and deployment pipelines.', 2, 1, 1, 2, 'active', 'urgent', '2024-10-01', '2025-04-30', 350000.00, 'IT-AI-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ShopEasy E-commerce Phase 2', 'Second phase of e-commerce platform development including mobile app, payment gateway integration, and inventory sync.', 4, 1, 3, 4, 'active', 'high', '2025-01-01', '2025-06-30', 400000.00, 'SE-ECOM-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Planning Projects
('HealthPlus HMS Upgrade', 'Hospital management system upgrade with new modules for patient records, billing, and telemedicine.', 2, 1, 1, 8, 'planning', 'medium', '2025-03-01', '2025-09-30', 450000.00, 'HP-HMS-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SecureInvest Trading Platform', 'High-frequency trading platform with real-time market data and advanced analytics.', 2, 1, 1, 7, 'planning', 'high', '2025-04-01', '2025-12-31', 600000.00, 'SI-TP-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- On Hold Projects
('SteelWorks ERP', 'ERP implementation for SteelWorks Industries - on hold pending budget approval.', 2, 1, 1, 10, 'on_hold', 'medium', '2025-02-01', '2025-08-31', 300000.00, 'SW-ERP-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Completed Projects
('FreshMart Inventory System', 'Inventory management system for FreshMart Groceries - successfully delivered.', 4, 1, 3, 5, 'completed', 'medium', '2024-06-01', '2024-11-30', 180000.00, 'FM-INV-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FinanceFirst Core Banking Maintenance', 'Quarterly maintenance and bug fixes for core banking system.', 2, 1, 1, 6, 'completed', 'low', '2024-10-01', '2024-12-31', 75000.00, 'FF-CBM-Q4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Marketing & Internal Projects
('Company Website Redesign', 'Corporate website redesign with modern UI/UX and improved SEO.', 5, 5, 4, NULL, 'active', 'medium', '2025-01-15', '2025-04-15', 80000.00, 'WEB-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('LearnSmart LMS Development', 'Learning management system for LearnSmart Academy with video streaming and assessment modules.', 4, 1, 3, 12, 'active', 'high', '2024-11-15', '2025-05-31', 280000.00, 'LS-LMS-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- TASKS
-- =====================================================
INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date, estimated_hours, tags, task_code, sort_order, block_reason, created_at, updated_at) VALUES
-- Office Management System (Project 1) - Mixed statuses
(1, 'Setup development environment', 'Configure local dev environment with Node.js, PostgreSQL, and React toolchain', 7, 2, 'done', 'high', '2024-11-10', 8, ARRAY['setup', 'devops'], 'OMS-001-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '55 days'),
(1, 'Design database schema', 'Create comprehensive PostgreSQL schema for all modules including users, leaves, attendance, and projects', 8, 2, 'done', 'high', '2024-11-20', 16, ARRAY['database', 'design'], 'OMS-001-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(1, 'Implement user authentication', 'JWT-based authentication with access and refresh tokens, role-based authorization', 7, 2, 'done', 'high', '2024-12-01', 24, ARRAY['auth', 'security'], 'OMS-001-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '35 days'),
(1, 'Build leave management module', 'Complete leave application, approval workflow, and balance tracking', 9, 2, 'approved', 'high', '2024-12-15', 40, ARRAY['backend', 'frontend'], 'OMS-001-T004', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(1, 'Implement attendance tracking', 'Check-in/out system with location tracking and regularization requests', 8, 2, 'in_progress', 'high', '2025-01-20', 32, ARRAY['backend', 'mobile'], 'OMS-001-T005', 5, NULL, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 'Build project management module', 'Projects and tasks CRUD, Kanban board, task dependencies', 7, 2, 'in_progress', 'medium', '2025-01-25', 48, ARRAY['frontend', 'backend'], 'OMS-001-T006', 6, NULL, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 'Create mobile app shell', 'React Native app with authentication and navigation setup', 9, 2, 'done', 'high', '2025-01-10', 24, ARRAY['mobile', 'react-native'], 'OMS-001-T007', 7, NULL, CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(1, 'Implement dashboard analytics', 'Admin and employee dashboards with charts and statistics', 8, 2, 'todo', 'medium', '2025-02-10', 20, ARRAY['frontend', 'charts'], 'OMS-001-T008', 8, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 'Add notification system', 'Real-time notifications using Socket.io and push notifications', 7, 2, 'blocked', 'medium', '2025-02-15', 16, ARRAY['backend', 'realtime'], 'OMS-001-T009', 9, 'Waiting for mobile app push notification setup', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 'Performance optimization', 'Database query optimization, caching, and frontend bundle optimization', 9, 2, 'todo', 'low', '2025-03-01', 24, ARRAY['performance', 'optimization'], 'OMS-001-T010', 10, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- TechCorp ERP Integration (Project 2)
(2, 'Requirements gathering', 'Document all ERP requirements with TechCorp team', 7, 2, 'done', 'high', '2024-12-15', 16, ARRAY['requirements', 'documentation'], 'TC-ERP-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP - INTERVAL '40 days'),
(2, 'System architecture design', 'Design microservices architecture for ERP modules', 8, 2, 'done', 'high', '2024-12-25', 24, ARRAY['architecture', 'design'], 'TC-ERP-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(2, 'Inventory module development', 'Build inventory tracking with barcode scanning support', 7, 2, 'in_progress', 'high', '2025-02-15', 60, ARRAY['inventory', 'backend'], 'TC-ERP-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 'Procurement workflow', 'Purchase orders, vendor management, and approval workflows', 9, 2, 'todo', 'high', '2025-03-15', 48, ARRAY['procurement', 'workflow'], 'TC-ERP-T004', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 'Financial reporting module', 'GL integration, P&L reports, and balance sheets', 10, 2, 'todo', 'medium', '2025-04-30', 56, ARRAY['finance', 'reports'], 'TC-ERP-T005', 5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 'API integration layer', 'REST APIs for third-party system integration', 8, 2, 'in_progress', 'medium', '2025-02-28', 32, ARRAY['api', 'integration'], 'TC-ERP-T006', 6, NULL, CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- CloudNine Migration (Project 3)
(3, 'Infrastructure assessment', 'Audit current on-premise infrastructure and create migration plan', 7, 2, 'done', 'high', '2025-01-25', 16, ARRAY['assessment', 'planning'], 'CN-MIG-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(3, 'AWS environment setup', 'Set up VPC, EC2 instances, RDS, and S3 buckets', 8, 2, 'in_progress', 'high', '2025-02-10', 24, ARRAY['aws', 'infrastructure'], 'CN-MIG-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 'Database migration', 'Migrate databases to Amazon RDS with minimal downtime', 7, 2, 'todo', 'high', '2025-03-01', 32, ARRAY['database', 'migration'], 'CN-MIG-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 'Application deployment', 'Deploy applications to ECS with auto-scaling', 9, 2, 'todo', 'medium', '2025-03-20', 24, ARRAY['deployment', 'ecs'], 'CN-MIG-T004', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 'Security hardening', 'Implement security groups, IAM policies, and encryption', 8, 2, 'todo', 'high', '2025-04-01', 20, ARRAY['security', 'aws'], 'CN-MIG-T005', 5, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- InnovateTech AI Platform (Project 4)
(4, 'ML infrastructure setup', 'Set up GPU clusters and ML training environment', 7, 1, 'done', 'urgent', '2024-10-20', 24, ARRAY['ml', 'infrastructure'], 'IT-AI-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '80 days'),
(4, 'Data pipeline development', 'Build ETL pipelines for training data preparation', 8, 1, 'done', 'high', '2024-11-15', 40, ARRAY['data', 'etl'], 'IT-AI-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '80 days', CURRENT_TIMESTAMP - INTERVAL '65 days'),
(4, 'Model training framework', 'Implement distributed training with PyTorch', 7, 1, 'in_progress', 'urgent', '2025-01-30', 48, ARRAY['ml', 'pytorch'], 'IT-AI-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(4, 'Model deployment pipeline', 'CI/CD pipeline for model versioning and deployment', 9, 1, 'blocked', 'high', '2025-02-15', 32, ARRAY['mlops', 'deployment'], 'IT-AI-T004', 4, 'Waiting for model training framework completion', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 'API gateway for inference', 'High-performance API for model inference with caching', 8, 1, 'todo', 'high', '2025-03-01', 24, ARRAY['api', 'inference'], 'IT-AI-T005', 5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(4, 'Monitoring and alerting', 'Model performance monitoring and drift detection', 10, 1, 'todo', 'medium', '2025-03-30', 20, ARRAY['monitoring', 'mlops'], 'IT-AI-T006', 6, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- ShopEasy E-commerce Phase 2 (Project 5)
(5, 'Mobile app UI design', 'Design mobile app screens in Figma', 16, 4, 'done', 'high', '2025-01-15', 32, ARRAY['design', 'mobile'], 'SE-ECOM-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(5, 'React Native app development', 'Build mobile app with product browsing and cart', 13, 4, 'in_progress', 'high', '2025-02-28', 80, ARRAY['mobile', 'react-native'], 'SE-ECOM-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(5, 'Payment gateway integration', 'Integrate Razorpay and PayTM payment gateways', 14, 4, 'todo', 'high', '2025-03-15', 24, ARRAY['payment', 'integration'], 'SE-ECOM-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(5, 'Inventory sync system', 'Real-time inventory sync between POS and e-commerce', 15, 4, 'todo', 'medium', '2025-04-15', 40, ARRAY['inventory', 'sync'], 'SE-ECOM-T004', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(5, 'Order tracking system', 'Order status tracking with delivery partner integration', 13, 4, 'todo', 'medium', '2025-05-01', 32, ARRAY['orders', 'tracking'], 'SE-ECOM-T005', 5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- Company Website Redesign (Project 11)
(11, 'Website wireframes', 'Create wireframes for all pages', 16, 5, 'done', 'medium', '2025-01-25', 16, ARRAY['design', 'wireframe'], 'WEB-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(11, 'Visual design mockups', 'High-fidelity design mockups', 16, 5, 'in_progress', 'medium', '2025-02-10', 24, ARRAY['design', 'ui'], 'WEB-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(11, 'Frontend development', 'Build responsive website with Next.js', 17, 5, 'todo', 'medium', '2025-03-15', 48, ARRAY['frontend', 'nextjs'], 'WEB-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(11, 'SEO optimization', 'Implement SEO best practices and meta tags', 17, 5, 'todo', 'low', '2025-04-01', 12, ARRAY['seo'], 'WEB-T004', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- LearnSmart LMS Development (Project 12)
(12, 'LMS requirements analysis', 'Document all LMS features and user stories', 13, 4, 'done', 'high', '2024-11-30', 16, ARRAY['requirements'], 'LS-LMS-T001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '50 days'),
(12, 'Course management module', 'CRUD for courses, lessons, and materials', 14, 4, 'done', 'high', '2024-12-20', 40, ARRAY['backend', 'courses'], 'LS-LMS-T002', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP - INTERVAL '35 days'),
(12, 'Video streaming integration', 'Integrate video player with progress tracking', 13, 4, 'in_progress', 'high', '2025-02-15', 32, ARRAY['video', 'streaming'], 'LS-LMS-T003', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(12, 'Assessment and quiz system', 'Online tests with auto-grading and analytics', 15, 4, 'todo', 'medium', '2025-03-15', 40, ARRAY['assessment', 'quiz'], 'LS-LMS-T004', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(12, 'Certificate generation', 'Automated certificate generation on course completion', 14, 4, 'todo', 'low', '2025-04-30', 16, ARRAY['certificate'], 'LS-LMS-T005', 5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days');

-- =====================================================
-- TASK ATTACHMENTS
-- =====================================================
INSERT INTO task_attachments (task_id, uploaded_by, link_title, link_url, created_at) VALUES
(1, 2, 'Development Setup Guide', 'https://docs.company.com/dev-setup', CURRENT_TIMESTAMP - INTERVAL '55 days'),
(2, 2, 'Database Schema ERD', 'https://drive.google.com/file/d/db-schema-erd', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(3, 7, 'Authentication Flow Diagram', 'https://miro.com/app/board/auth-flow', CURRENT_TIMESTAMP - INTERVAL '35 days'),
(4, 9, 'Leave Module API Docs', 'https://docs.company.com/api/leaves', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(5, 8, 'Attendance Wireframes', 'https://figma.com/file/attendance-wireframes', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(11, 7, 'TechCorp Requirements Doc', 'https://docs.google.com/document/techcorp-requirements', CURRENT_TIMESTAMP - INTERVAL '40 days'),
(12, 8, 'ERP Architecture Diagram', 'https://lucidchart.com/erp-architecture', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(17, 7, 'AWS Infrastructure Diagram', 'https://cloudcraft.co/cloudnine-infrastructure', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(22, 7, 'ML Pipeline Documentation', 'https://notion.so/ml-pipeline-docs', CURRENT_TIMESTAMP - INTERVAL '80 days'),
(27, 16, 'Mobile App Figma Designs', 'https://figma.com/file/shopeasy-mobile-app', CURRENT_TIMESTAMP - INTERVAL '10 days');

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'SEED DATA SUMMARY' as info;
SELECT 'Departments: ' || COUNT(*) as count FROM departments;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Clients: ' || COUNT(*) as count FROM clients;
SELECT 'Projects: ' || COUNT(*) as count FROM projects;
SELECT 'Tasks: ' || COUNT(*) as count FROM tasks;
SELECT 'Task Attachments: ' || COUNT(*) as count FROM task_attachments;
SELECT 'Holidays: ' || COUNT(*) as count FROM holidays;
SELECT 'Leave Balances: ' || COUNT(*) as count FROM leave_balances;
SELECT 'Leave Requests: ' || COUNT(*) as count FROM leave_requests;
SELECT 'Leave Approvals: ' || COUNT(*) as count FROM leave_approvals;
SELECT 'Attendance Settings: ' || COUNT(*) as count FROM attendance_settings;
SELECT 'Attendance Records: ' || COUNT(*) as count FROM attendance;
SELECT 'Regularizations: ' || COUNT(*) as count FROM attendance_regularizations;
SELECT 'Notifications: ' || COUNT(*) as count FROM notifications;
SELECT 'Daily Reports: ' || COUNT(*) as count FROM daily_reports;

-- Show sample users
SELECT
    id,
    email,
    CONCAT(first_name, ' ', last_name) as name,
    role,
    department_id
FROM users
ORDER BY id
LIMIT 10;

-- Show clients
SELECT
    id,
    name,
    contact_person,
    status
FROM clients
ORDER BY id;

-- Show projects
SELECT
    id,
    name,
    status,
    priority,
    owner_id
FROM projects
ORDER BY id;

-- Show task summary by status
SELECT
    status,
    COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY status;
