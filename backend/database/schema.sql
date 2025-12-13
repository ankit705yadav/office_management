-- Operation Management System Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE leave_type AS ENUM ('sick', 'casual', 'earned', 'comp_off', 'paternity', 'maternity');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE expense_category AS ENUM ('travel', 'food', 'accommodation', 'office_supplies', 'software', 'hardware', 'training', 'other');
CREATE TYPE inventory_status AS ENUM ('available', 'assigned', 'under_repair', 'damaged', 'retired');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for department head
ALTER TABLE departments
ADD CONSTRAINT fk_department_head
FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- Refresh tokens table (for JWT authentication)
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LEAVE MANAGEMENT
-- ============================================

-- Leave balances table
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    sick_leave DECIMAL(4, 1) DEFAULT 12.0,
    casual_leave DECIMAL(4, 1) DEFAULT 12.0,
    earned_leave DECIMAL(4, 1) DEFAULT 15.0,
    comp_off DECIMAL(4, 1) DEFAULT 0.0,
    paternity_maternity DECIMAL(4, 1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(3, 1) NOT NULL,
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
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
-- EXPENSE MANAGEMENT
-- ============================================

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    category expense_category NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    status request_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PAYROLL MANAGEMENT
-- ============================================

-- Payroll table
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
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
    total_deductions DECIMAL(10, 2) NOT NULL,
    net_salary DECIMAL(10, 2) NOT NULL,
    payslip_url TEXT,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, year)
);

-- Employee Salary Details table
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

-- Index for employee salary details
CREATE INDEX idx_employee_salary_user_id ON employee_salary_details(user_id);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_value DECIMAL(10, 2),
    status inventory_status DEFAULT 'available',
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    purchase_date DATE,
    warranty_expiry DATE,
    serial_number VARCHAR(100),
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory history (for tracking assignments)
CREATE TABLE inventory_history (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECT MANAGEMENT
-- ============================================

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status project_status DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    due_date DATE,
    parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task comments table
CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task attachments table
CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Leave requests indexes
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Expenses indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- Payroll indexes
CREATE INDEX idx_payroll_user_id ON payroll(user_id);
CREATE INDEX idx_payroll_month_year ON payroll(month, year);

-- Inventory indexes
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_assigned_to ON inventory(assigned_to_user_id);
CREATE INDEX idx_inventory_category ON inventory(category);

-- Tasks indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all relevant tables
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

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================

-- Insert default department
INSERT INTO departments (name, description) VALUES
('IT', 'Information Technology'),
('HR', 'Human Resources'),
('Finance', 'Finance & Accounting'),
('Operations', 'Operations & Management'),
('Sales', 'Sales & Marketing');

-- Insert default admin user (password: Admin@123)
-- Password hash for 'Admin@123' (bcrypt with 10 rounds)
INSERT INTO users (
    email, password_hash, first_name, last_name,
    date_of_joining, role, status, department_id
) VALUES (
    'admin@elisrun.com',
    '$2b$10$xKvPl5vLQm5Y0UZLVqG9NOtqH5z0gYM.xI0Qh3JKX8vP1EQ2ZJYxW',
    'System',
    'Administrator',
    CURRENT_DATE,
    'admin',
    'active',
    1
);

-- Insert employee salary details (sample data for testing)
INSERT INTO employee_salary_details (
    user_id, employee_code, pan_number, bank_account_number,
    bank_name, bank_ifsc_code, bank_branch, pf_account_number,
    uan_number, basic_salary, hra_percentage, transport_allowance,
    other_allowances, pf_applicable, esi_applicable, professional_tax, tax_regime
) VALUES (
    1, -- admin user
    'EMP001',
    'ABCDE1234F',
    '1234567890123456',
    'HDFC Bank',
    'HDFC0001234',
    'Bangalore Main Branch',
    'KA/BGP/0123456/000/0001234',
    '100123456789',
    50000.00,
    40.0,
    1600.00,
    3000.00,
    TRUE,
    FALSE,
    200.00,
    'old'
);

-- Insert current year holidays (India - 2025 sample)
INSERT INTO holidays (date, name, description, is_optional, year) VALUES
('2025-01-26', 'Republic Day', 'National holiday', FALSE, 2025),
('2025-03-14', 'Holi', 'Festival of colors', FALSE, 2025),
('2025-04-14', 'Ambedkar Jayanti', 'Dr. B.R. Ambedkar birth anniversary', TRUE, 2025),
('2025-08-15', 'Independence Day', 'National holiday', FALSE, 2025),
('2025-10-02', 'Gandhi Jayanti', 'Mahatma Gandhi birth anniversary', FALSE, 2025),
('2025-10-24', 'Diwali', 'Festival of lights', FALSE, 2025),
('2025-12-25', 'Christmas', 'Christmas Day', FALSE, 2025);

COMMENT ON DATABASE office_management IS 'Operation Management System for Elisrun Technologies';
