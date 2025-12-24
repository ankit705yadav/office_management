-- Seed Data for Operation Management System
-- This script populates the database with initial test data

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE daily_reports CASCADE;
TRUNCATE TABLE attendance_regularizations CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE attendance_settings CASCADE;
TRUNCATE TABLE leave_requests CASCADE;
TRUNCATE TABLE leave_balances CASCADE;
TRUNCATE TABLE holidays CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE departments CASCADE;

-- Reset sequences
ALTER SEQUENCE departments_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE holidays_id_seq RESTART WITH 1;
ALTER SEQUENCE leave_balances_id_seq RESTART WITH 1;
ALTER SEQUENCE leave_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_regularizations_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_reports_id_seq RESTART WITH 1;

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

-- Admin (ID: 1)
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, created_at, updated_at) VALUES
('admin@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'System', 'Administrator', '+91-9876543210', '1985-01-15', '2020-01-01', 'admin', 'active', 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Managers (IDs: 2-6)
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, created_at, updated_at) VALUES
('john.manager@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'John', 'Smith', '+91-9876543211', '1988-03-20', '2020-06-01', 'manager', 'active', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sarah.hr@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Sarah', 'Johnson', '+91-9876543212', '1987-07-10', '2020-03-15', 'manager', 'active', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mike.sales@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Mike', 'Wilson', '+91-9876543213', '1989-11-25', '2021-01-10', 'manager', 'active', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lisa.marketing@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Lisa', 'Brown', '+91-9876543214', '1990-05-18', '2021-04-01', 'manager', 'active', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('david.finance@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'David', 'Lee', '+91-9876543215', '1986-09-30', '2020-08-01', 'manager', 'active', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Employees (IDs: 7-20)
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, created_at, updated_at) VALUES
-- Engineering Team
('alice.dev@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Alice', 'Anderson', '+91-9876543220', '1995-02-14', '2022-01-15', 'employee', 'active', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bob.dev@company.com', '$2b$10$rpxT0F6Xd6G6Mrn0kI143e.IvNHvdLWk/wE8Mb7JTstLOFuZrJV8.', 'Bob', 'Baker', '+91-9876543221', '1994-06-22', '2022-03-01', 'employee', 'active', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
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
-- HOLIDAYS (2025)
-- =====================================================
INSERT INTO holidays (name, date, description, year, created_at, updated_at) VALUES
('New Year', '2025-01-01', 'New Year Day', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Republic Day', '2025-01-26', 'Republic Day of India', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Holi', '2025-03-14', 'Festival of Colors', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Good Friday', '2025-04-18', 'Good Friday', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Eid ul-Fitr', '2025-04-21', 'End of Ramadan', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Independence Day', '2025-08-15', 'Independence Day of India', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Gandhi Jayanti', '2025-10-02', 'Birth Anniversary of Mahatma Gandhi', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Dussehra', '2025-10-22', 'Victory of Good over Evil', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Diwali', '2025-11-12', 'Festival of Lights', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Christmas', '2025-12-25', 'Christmas Day', 2025, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- LEAVE BALANCES (All users - Current year)
-- =====================================================
INSERT INTO leave_balances (user_id, year, casual_leave, sick_leave, earned_leave, created_at, updated_at)
SELECT
    id as user_id,
    2025 as year,
    12 as casual_leave,
    12 as sick_leave,
    15 as earned_leave,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users WHERE status = 'active';

-- =====================================================
-- LEAVE REQUESTS (Sample data)
-- =====================================================
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, approver_id, is_half_day, half_day_session, created_at, updated_at) VALUES
-- Approved leaves
(7, 'casual', '2025-11-10', '2025-11-12', 3, 'Family function', 'approved', 2, false, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(8, 'sick', '2025-11-15', '2025-11-15', 1, 'Not feeling well', 'approved', 2, false, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(11, 'earned', '2025-11-20', '2025-11-22', 3, 'Personal work', 'approved', 3, false, NULL, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),

-- Pending leaves
(9, 'casual', '2025-11-25', '2025-11-25', 0.5, 'Doctor appointment', 'pending', NULL, true, 'morning', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(13, 'casual', '2025-11-28', '2025-11-29', 2, 'Family event', 'pending', NULL, false, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Rejected leave
(10, 'casual', '2025-12-24', '2025-12-27', 4, 'Vacation', 'rejected', 2, false, NULL, CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days');

-- Update leave balances for approved leaves
UPDATE leave_balances SET casual_leave = casual_leave - 3 WHERE user_id = 7 AND year = 2025;
UPDATE leave_balances SET sick_leave = sick_leave - 1 WHERE user_id = 8 AND year = 2025;
UPDATE leave_balances SET earned_leave = earned_leave - 3 WHERE user_id = 11 AND year = 2025;

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
-- SUMMARY
-- =====================================================
SELECT 'SEED DATA SUMMARY' as info;
SELECT 'Departments: ' || COUNT(*) as count FROM departments;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Holidays: ' || COUNT(*) as count FROM holidays;
SELECT 'Leave Balances: ' || COUNT(*) as count FROM leave_balances;
SELECT 'Leave Requests: ' || COUNT(*) as count FROM leave_requests;
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
