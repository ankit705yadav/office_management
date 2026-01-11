-- Office Management System Database Schema
-- PostgreSQL 14+
-- Modules: Users, Leaves, Attendance, Projects, Holidays, Notifications

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE leave_type AS ENUM ('sick_leave', 'casual_leave', 'earned_leave', 'comp_off', 'paternity_maternity');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled');

-- ============================================
-- CORE TABLES
-- ============================================

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_id INTEGER,
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
    role user_role DEFAULT 'employee',
    status user_status DEFAULT 'active',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    profile_image_url TEXT,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for department head
ALTER TABLE departments
ADD CONSTRAINT fk_department_head
FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee custom fields
CREATE TABLE employee_custom_fields (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee documents (link attachments)
CREATE TABLE employee_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_title VARCHAR(255) NOT NULL,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LEAVE MANAGEMENT
-- ============================================

-- Leave balances table (Total: 25 = 12 sick + 12 casual + 1 birthday)
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    sick_leave DECIMAL(4, 1) DEFAULT 12.0,
    casual_leave DECIMAL(4, 1) DEFAULT 12.0,
    earned_leave DECIMAL(4, 1) DEFAULT 0.0,
    comp_off DECIMAL(4, 1) DEFAULT 0.0,
    paternity_maternity DECIMAL(4, 1) DEFAULT 0.0,
    birthday_leave DECIMAL(4, 1) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(3, 1) NOT NULL,
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    is_half_day BOOLEAN DEFAULT FALSE,
    half_day_session VARCHAR(20),
    document_url TEXT,
    current_approval_level INTEGER DEFAULT 1,
    total_approval_levels INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave approvals table (multi-level approval)
CREATE TABLE leave_approvals (
    id SERIAL PRIMARY KEY,
    leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id INTEGER NOT NULL REFERENCES users(id),
    approval_order INTEGER NOT NULL DEFAULT 1,
    status approval_status DEFAULT 'pending',
    comments TEXT,
    acted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holidays table
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ATTENDANCE MANAGEMENT
-- ============================================

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_location VARCHAR(500),
    check_out_location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'absent',
    work_hours DECIMAL(4, 2) DEFAULT 0,
    is_late BOOLEAN DEFAULT FALSE,
    is_early_departure BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Attendance regularizations
CREATE TABLE attendance_regularizations (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    requested_check_in TIMESTAMP,
    requested_check_out TIMESTAMP,
    requested_location VARCHAR(500),
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id),
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance settings table
CREATE TABLE attendance_settings (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '18:00:00',
    grace_period_minutes INTEGER DEFAULT 10,
    half_day_hours DECIMAL(3, 1) DEFAULT 4.0,
    full_day_hours DECIMAL(3, 1) DEFAULT 8.0,
    working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
    auto_checkout_enabled BOOLEAN DEFAULT FALSE,
    auto_checkout_time TIME DEFAULT '18:00:00',
    location_tracking_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id)
);

-- ============================================
-- SALARY & PAYMENTS
-- ============================================

-- Employee salaries table
CREATE TABLE employee_salaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    basic_salary DECIMAL(12, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    salary_id INTEGER NOT NULL REFERENCES employee_salaries(id) ON DELETE CASCADE,
    payment_month INTEGER NOT NULL,
    payment_year INTEGER NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMP,
    paid_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECT MANAGEMENT
-- ============================================

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    contact_person VARCHAR(200),
    website VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    status project_status DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    project_code VARCHAR(50),
    is_folder BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    due_date DATE,
    estimated_hours DECIMAL(6, 2),
    tags TEXT[],
    task_code VARCHAR(50),
    attachment_url TEXT,
    action_required BOOLEAN DEFAULT FALSE,
    actual_hours DECIMAL(8, 2) DEFAULT 0,
    depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    block_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task attachments table (link attachments)
CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    link_title VARCHAR(255) NOT NULL,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project attachments table (link attachments)
CREATE TABLE project_attachments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_title VARCHAR(255) NOT NULL,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task dependencies table (many-to-many for chained tasks)
CREATE TABLE task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id),
    CHECK(task_id != depends_on_task_id)
);

-- Task comments table (with threading support)
CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions INTEGER[] DEFAULT '{}',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DAILY REPORTS
-- ============================================

-- Daily reports table (simplified - title and description only)
CREATE TABLE daily_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_date)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    related_id INTEGER,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

CREATE INDEX idx_leave_approvals_request_id ON leave_approvals(leave_request_id);
CREATE INDEX idx_leave_approvals_approver_id ON leave_approvals(approver_id);

CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_parent_id ON task_comments(parent_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_report_date ON daily_reports(report_date);
CREATE INDEX idx_daily_reports_user_date ON daily_reports(user_id, report_date);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert departments
INSERT INTO departments (name, description, created_at, updated_at) VALUES
('IT', 'Information Technology', NOW(), NOW()),
('HR', 'Human Resources', NOW(), NOW()),
('Finance', 'Finance & Accounting', NOW(), NOW()),
('Operations', 'Operations & Management', NOW(), NOW()),
('Sales', 'Sales & Marketing', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (password: Admin@123)
INSERT INTO users (
    email, password_hash, first_name, last_name,
    date_of_joining, role, status, department_id, created_at, updated_at
) VALUES (
    'admin@company.com',
    '$2b$10$5Czz6Xz3PtamrHEPk.7IbuXBaVYYRQyS3Gkxa2KJRl7THMdciFrRe',
    'System',
    'Administrator',
    '2024-01-01',
    'admin',
    'active',
    1,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert manager user (password: Admin@123)
INSERT INTO users (
    email, password_hash, first_name, last_name,
    date_of_joining, role, status, department_id, manager_id, created_at, updated_at
) VALUES (
    'john.doe@company.com',
    '$2b$10$5Czz6Xz3PtamrHEPk.7IbuXBaVYYRQyS3Gkxa2KJRl7THMdciFrRe',
    'John',
    'Doe',
    '2024-01-15',
    'manager',
    'active',
    1,
    1,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert employee user (password: Admin@123)
INSERT INTO users (
    email, password_hash, first_name, last_name,
    date_of_joining, role, status, department_id, manager_id, created_at, updated_at
) VALUES (
    'jane.smith@company.com',
    '$2b$10$5Czz6Xz3PtamrHEPk.7IbuXBaVYYRQyS3Gkxa2KJRl7THMdciFrRe',
    'Jane',
    'Smith',
    '2024-02-01',
    'employee',
    'active',
    1,
    2,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Set department head
UPDATE departments SET head_id = 2 WHERE id = 1;

-- Insert leave balances for current year
INSERT INTO leave_balances (user_id, year, sick_leave, casual_leave, earned_leave, comp_off, paternity_maternity, created_at, updated_at)
VALUES
(1, 2025, 12, 12, 15, 0, 0, NOW(), NOW()),
(2, 2025, 12, 12, 15, 0, 0, NOW(), NOW()),
(3, 2025, 12, 12, 15, 0, 0, NOW(), NOW())
ON CONFLICT (user_id, year) DO NOTHING;

-- Insert holidays for 2025
INSERT INTO holidays (date, name, description, is_optional, year, created_at, updated_at) VALUES
('2025-01-01', 'New Year''s Day', 'New Year celebration', FALSE, 2025, NOW(), NOW()),
('2025-01-26', 'Republic Day', 'National holiday', FALSE, 2025, NOW(), NOW()),
('2025-03-14', 'Holi', 'Festival of colors', FALSE, 2025, NOW(), NOW()),
('2025-04-14', 'Ambedkar Jayanti', 'Dr. B.R. Ambedkar birth anniversary', TRUE, 2025, NOW(), NOW()),
('2025-04-18', 'Good Friday', 'Christian holiday', TRUE, 2025, NOW(), NOW()),
('2025-05-01', 'May Day', 'Labour Day', FALSE, 2025, NOW(), NOW()),
('2025-08-15', 'Independence Day', 'National holiday', FALSE, 2025, NOW(), NOW()),
('2025-10-02', 'Gandhi Jayanti', 'Mahatma Gandhi birth anniversary', FALSE, 2025, NOW(), NOW()),
('2025-10-20', 'Dussehra', 'Victory of good over evil', FALSE, 2025, NOW(), NOW()),
('2025-11-01', 'Diwali', 'Festival of lights', FALSE, 2025, NOW(), NOW()),
('2025-12-25', 'Christmas', 'Christmas Day', FALSE, 2025, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert a sample client
INSERT INTO clients (name, email, contact_person, created_by, created_at, updated_at)
VALUES ('Internal', 'internal@company.com', 'System Admin', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert a sample project
INSERT INTO projects (name, description, owner_id, created_by, department_id, client_id, status, start_date, created_at, updated_at)
VALUES ('Office Management System', 'Internal HR and operations management platform', 1, 1, 1, 1, 'active', '2025-01-01', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date, created_at, updated_at)
VALUES
(1, 'Setup development environment', 'Configure local dev environment for all team members', 2, 1, 'done', 'high', '2025-01-15', NOW(), NOW()),
(1, 'Design database schema', 'Create PostgreSQL schema for all modules', 2, 1, 'done', 'high', '2025-01-20', NOW(), NOW()),
(1, 'Implement authentication', 'JWT-based authentication system', 3, 2, 'done', 'high', '2025-02-01', NOW(), NOW()),
(1, 'Build leave management module', 'Complete leave application and approval workflow', 3, 2, 'in_progress', 'medium', '2025-02-15', NOW(), NOW())
ON CONFLICT DO NOTHING;

COMMENT ON DATABASE office_management IS 'Office Management System - Company Name';
