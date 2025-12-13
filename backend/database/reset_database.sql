-- ============================================================================
-- DATABASE RESET SCRIPT
-- This script drops and recreates the entire database with fresh test data
-- ============================================================================

-- Drop existing database
DROP DATABASE IF EXISTS office_management;

-- Create fresh database
CREATE DATABASE office_management;

-- Connect to the database
\c office_management;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    date_of_joining DATE NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    profile_image_url TEXT,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave balances table
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    sick_leave DECIMAL(5, 2) DEFAULT 12.0,
    casual_leave DECIMAL(5, 2) DEFAULT 12.0,
    earned_leave DECIMAL(5, 2) DEFAULT 18.0,
    comp_off DECIMAL(5, 2) DEFAULT 0.0,
    paternity_maternity DECIMAL(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick_leave', 'casual_leave', 'earned_leave', 'comp_off', 'paternity_maternity')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(5, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    is_half_day BOOLEAN DEFAULT FALSE,
    half_day_session VARCHAR(20) CHECK (half_day_session IN ('first_half', 'second_half')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holidays table
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_location TEXT,
    check_out_location TEXT,
    status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'half_day', 'on_leave', 'holiday', 'week_off')),
    work_hours DECIMAL(5, 2),
    is_late BOOLEAN DEFAULT FALSE,
    is_early_departure BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Attendance regularizations table
CREATE TABLE attendance_regularizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    requested_check_in TIMESTAMP,
    requested_check_out TIMESTAMP,
    requested_location TEXT,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'birthday', 'anniversary', 'leave', 'attendance')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee salary details table
CREATE TABLE employee_salary_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE,
    pan_number VARCHAR(10),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc_code VARCHAR(11),
    bank_branch VARCHAR(100),
    pf_account_number VARCHAR(50),
    uan_number VARCHAR(12),
    esi_number VARCHAR(17),
    basic_salary DECIMAL(10, 2) NOT NULL,
    hra_percentage DECIMAL(5, 2) DEFAULT 40.0,
    transport_allowance DECIMAL(10, 2) DEFAULT 1600,
    other_allowances DECIMAL(10, 2) DEFAULT 0,
    pf_applicable BOOLEAN DEFAULT TRUE,
    esi_applicable BOOLEAN DEFAULT FALSE,
    professional_tax DECIMAL(10, 2) DEFAULT 200,
    tax_regime VARCHAR(10) DEFAULT 'old',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll table
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL,
    hra DECIMAL(10, 2) DEFAULT 0,
    transport_allowance DECIMAL(10, 2) DEFAULT 0,
    other_allowances DECIMAL(10, 2) DEFAULT 0,
    gross_salary DECIMAL(10, 2) NOT NULL,
    pf_deduction DECIMAL(10, 2) DEFAULT 0,
    esi_deduction DECIMAL(10, 2) DEFAULT 0,
    tax_deduction DECIMAL(10, 2) DEFAULT 0,
    other_deductions DECIMAL(10, 2) DEFAULT 0,
    total_deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    payslip_url TEXT,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, year)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_year ON holidays(year);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_regularizations_user ON attendance_regularizations(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_employee_salary_user_id ON employee_salary_details(user_id);
CREATE INDEX idx_payroll_user_month_year ON payroll(user_id, month, year);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_regularizations_updated_at BEFORE UPDATE ON attendance_regularizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_salary_details_updated_at BEFORE UPDATE ON employee_salary_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TEST DATA
-- ============================================================================

-- Insert departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development and technical teams'),
('Human Resources', 'HR and employee management'),
('Sales', 'Sales and business development'),
('Marketing', 'Marketing and brand management'),
('Finance', 'Finance and accounting'),
('Operations', 'Operations and support');

-- Insert users (Password for all: Password@123)
-- bcrypt hash: $2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id) VALUES
-- Admin
('admin@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'System', 'Administrator', '+91-9876543210', '1985-01-15', '2020-01-01', 'admin', 'active', NULL, NULL),

-- Managers
('john.manager@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'John', 'Manager', '+91-9876543211', '1988-03-20', '2020-06-01', 'manager', 'active', 1, 1),
('sarah.hr@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Sarah', 'Johnson', '+91-9876543212', '1987-05-12', '2020-07-15', 'manager', 'active', 2, 1),
('mike.sales@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Mike', 'Wilson', '+91-9876543213', '1986-08-25', '2020-08-01', 'manager', 'active', 3, 1),

-- Employees - Engineering
('alice.dev@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Alice', 'Anderson', '+91-9876543214', '1992-01-10', '2022-01-15', 'employee', 'active', 1, 2),
('bob.dev@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Bob', 'Brown', '+91-9876543215', '1993-04-18', '2022-03-01', 'employee', 'active', 1, 2),
('carol.dev@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Carol', 'Clark', '+91-9876543216', '1994-07-22', '2022-06-15', 'employee', 'active', 1, 2),
('david.dev@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'David', 'Davis', '+91-9876543217', '1991-11-30', '2021-09-01', 'employee', 'active', 1, 2),

-- Employees - HR
('emma.hr@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Emma', 'Evans', '+91-9876543218', '1990-02-14', '2021-05-01', 'employee', 'active', 2, 3),
('frank.hr@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Frank', 'Fisher', '+91-9876543219', '1992-06-28', '2022-02-15', 'employee', 'active', 2, 3),

-- Employees - Sales
('grace.sales@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Grace', 'Green', '+91-9876543220', '1993-09-05', '2022-04-01', 'employee', 'active', 3, 4),
('henry.sales@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Henry', 'Harris', '+91-9876543221', '1991-12-16', '2021-11-15', 'employee', 'active', 3, 4),
('ivy.sales@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Ivy', 'Jackson', '+91-9876543222', '1994-03-08', '2023-01-10', 'employee', 'active', 3, 4),

-- Employees - Marketing
('jack.marketing@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Jack', 'Jones', '+91-9876543223', '1992-05-20', '2022-07-01', 'employee', 'active', 4, 1),
('kate.marketing@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Kate', 'King', '+91-9876543224', '1993-08-12', '2022-09-15', 'employee', 'active', 4, 1),

-- Employees - Finance
('leo.finance@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Leo', 'Lee', '+91-9876543225', '1990-10-25', '2021-03-01', 'employee', 'active', 5, 1),

-- Inactive employee for testing
('inactive.user@elisrun.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Inactive', 'User', '+91-9876543226', '1995-12-01', '2023-06-01', 'employee', 'inactive', 1, 2);

-- Insert leave balances for all active users for 2025
INSERT INTO leave_balances (user_id, year, sick_leave, casual_leave, earned_leave, comp_off, paternity_maternity)
SELECT id, 2025, 12.0, 12.0, 18.0, 0.0, 0.0
FROM users
WHERE status = 'active';

-- Insert some holidays for 2025
INSERT INTO holidays (date, name, description, is_optional, year) VALUES
('2025-01-26', 'Republic Day', 'Republic Day of India', FALSE, 2025),
('2025-03-14', 'Holi', 'Festival of Colors', FALSE, 2025),
('2025-04-14', 'Ambedkar Jayanti', 'Dr. B.R. Ambedkar Birthday', TRUE, 2025),
('2025-08-15', 'Independence Day', 'Independence Day of India', FALSE, 2025),
('2025-10-02', 'Gandhi Jayanti', 'Mahatma Gandhi Birthday', FALSE, 2025),
('2025-10-24', 'Diwali', 'Festival of Lights', FALSE, 2025),
('2025-12-25', 'Christmas', 'Christmas Day', FALSE, 2025);

-- Insert salary details for some employees (for testing payroll)
INSERT INTO employee_salary_details (
    user_id, employee_code, pan_number, bank_account_number, bank_name, bank_ifsc_code, bank_branch,
    pf_account_number, uan_number, basic_salary, hra_percentage, transport_allowance,
    other_allowances, pf_applicable, esi_applicable, professional_tax, tax_regime
) VALUES
-- Admin
(1, 'EMP001', 'ABCDE1234F', '1234567890123456', 'HDFC Bank', 'HDFC0001234', 'Bangalore Main',
 'KA/BGP/0123456/000/0001234', '100123456789', 50000.00, 40.0, 1600.00, 3000.00, TRUE, FALSE, 200.00, 'old'),

-- Alice (Engineering)
(5, 'EMP002', 'BCDEF2345G', '2345678901234567', 'ICICI Bank', 'ICIC0002345', 'Bangalore Koramangala',
 'KA/BGP/0123456/000/0002345', '100234567890', 45000.00, 40.0, 1600.00, 2500.00, TRUE, FALSE, 200.00, 'old'),

-- Bob (Engineering)
(6, 'EMP003', 'CDEFG3456H', '3456789012345678', 'SBI', 'SBIN0003456', 'Bangalore Indiranagar',
 'KA/BGP/0123456/000/0003456', '100345678901', 42000.00, 40.0, 1600.00, 2000.00, TRUE, FALSE, 200.00, 'new'),

-- David (Engineering - Senior)
(8, 'EMP004', 'DEFGH4567I', '4567890123456789', 'Axis Bank', 'UTIB0004567', 'Bangalore Whitefield',
 'KA/BGP/0123456/000/0004567', '100456789012', 60000.00, 40.0, 1600.00, 5000.00, TRUE, FALSE, 200.00, 'old'),

-- Sarah (HR Manager)
(3, 'EMP005', 'EFGHI5678J', '5678901234567890', 'HDFC Bank', 'HDFC0001234', 'Bangalore HSR',
 'KA/BGP/0123456/000/0005678', '100567890123', 55000.00, 40.0, 1600.00, 4000.00, TRUE, FALSE, 200.00, 'new');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

\echo '============================================================================'
\echo 'Database reset completed successfully!'
\echo '============================================================================'
\echo ''
\echo 'Test Users Created:'
\echo '  Admin:        admin@elisrun.com'
\echo '  Managers:     john.manager@elisrun.com, sarah.hr@elisrun.com, mike.sales@elisrun.com'
\echo '  Employees:    alice.dev@elisrun.com, bob.dev@elisrun.com, and 10 more'
\echo ''
\echo 'Default Password: Password@123'
\echo ''
\echo 'Departments:      6 departments created'
\echo 'Holidays:         7 holidays added for 2025'
\echo 'Salary Details:   5 employees with salary configured'
\echo '============================================================================'
