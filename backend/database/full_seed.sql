-- ============================================================================
-- COMPLETE DATABASE SEED FILE
-- Operation Management System - Fresh Test Data
-- ============================================================================

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
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
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
    document_url TEXT,
    current_approval_level INTEGER DEFAULT 1,
    total_approval_levels INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave approvals table (multi-level)
CREATE TABLE leave_approvals (
    id SERIAL PRIMARY KEY,
    leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approval_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
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
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'birthday', 'anniversary', 'leave', 'attendance', 'expense', 'advance_salary', 'payroll', 'inventory', 'task', 'project', 'daily_report')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily reports table (simplified - title and description only)
CREATE TABLE daily_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_date)
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

-- Advance salary requests table
CREATE TABLE advance_salary_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    requested_for_month INTEGER NOT NULL CHECK (requested_for_month BETWEEN 1 AND 12),
    requested_for_year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'cancelled')),
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    disbursed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('travel', 'food', 'accommodation', 'office_supplies', 'software', 'hardware', 'training', 'other')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense category caps table (for auto-approval)
CREATE TABLE expense_category_caps (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL UNIQUE CHECK (category IN ('travel', 'food', 'accommodation', 'office_supplies', 'software', 'hardware', 'training', 'other')),
    cap_amount DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    region VARCHAR(100) NOT NULL,
    qr_code_data TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc_code VARCHAR(20),
    contact_person VARCHAR(100),
    contact_person_phone VARCHAR(20),
    category VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_value DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'under_repair', 'damaged', 'retired')),
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    purchase_date DATE,
    warranty_expiry DATE,
    serial_number VARCHAR(100),
    location VARCHAR(200),
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory stock history table
CREATE TABLE inventory_stock_history (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('add', 'remove', 'adjust')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Products table (for SKU-based inventory management)
CREATE TABLE IF NOT EXISTS inventory_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    unit VARCHAR(50) DEFAULT 'piece',
    unit_price DECIMAL(10, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    reorder_point INTEGER DEFAULT 10,
    location VARCHAR(200),
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    qr_code TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements table (for tracking stock movements)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER DEFAULT 0,
    new_quantity INTEGER DEFAULT 0,
    reference_number VARCHAR(100),
    reason TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    -- Sender details (for stock in)
    sender_name VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_company VARCHAR(255),
    sender_address TEXT,
    -- Receiver details (for stock out)
    receiver_name VARCHAR(255),
    receiver_phone VARCHAR(50),
    receiver_company VARCHAR(255),
    receiver_address TEXT,
    -- Delivery person details
    delivery_person_name VARCHAR(255),
    delivery_person_phone VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'approved')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    estimated_hours DECIMAL(6, 2),
    tags TEXT[],
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project attachments table
CREATE TABLE IF NOT EXISTS project_attachments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_products_sku ON inventory_products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON inventory_products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_products_vendor_id ON inventory_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_projects_department ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project ON project_attachments(project_id);

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
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_report_date ON daily_reports(report_date);
CREATE INDEX idx_daily_reports_user_date ON daily_reports(user_id, report_date);
CREATE INDEX idx_employee_salary_user_id ON employee_salary_details(user_id);
CREATE INDEX idx_payroll_user_month_year ON payroll(user_id, month, year);
CREATE INDEX idx_advance_salary_user ON advance_salary_requests(user_id);
CREATE INDEX idx_advance_salary_status ON advance_salary_requests(status);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_assigned ON inventory(assigned_to_user_id);

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

CREATE TRIGGER update_leave_approvals_updated_at BEFORE UPDATE ON leave_approvals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_regularizations_updated_at BEFORE UPDATE ON attendance_regularizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_salary_details_updated_at BEFORE UPDATE ON employee_salary_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advance_salary_updated_at BEFORE UPDATE ON advance_salary_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
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
INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, date_of_joining, role, status, department_id, manager_id, address, pan_number, aadhar_number) VALUES
-- Admin
('admin@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'System', 'Administrator', '+91-9876543210', '1985-01-15', '2020-01-01', 'admin', 'active', 1, NULL, 'Bangalore, Karnataka', 'ABCDE1234F', '123456789012'),

-- Managers
('john.manager@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'John', 'Manager', '+91-9876543211', '1988-03-20', '2020-06-01', 'manager', 'active', 1, 1, 'Bangalore, Karnataka', 'BCDEF2345G', '234567890123'),
('sarah.hr@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Sarah', 'Johnson', '+91-9876543212', '1987-05-12', '2020-07-15', 'manager', 'active', 2, 1, 'Mumbai, Maharashtra', 'CDEFG3456H', '345678901234'),
('mike.sales@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Mike', 'Wilson', '+91-9876543213', '1986-08-25', '2020-08-01', 'manager', 'active', 3, 1, 'Delhi, NCR', 'DEFGH4567I', '456789012345'),

-- Employees - Engineering
('alice.dev@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Alice', 'Anderson', '+91-9876543214', '1992-01-10', '2022-01-15', 'employee', 'active', 1, 2, 'Bangalore, Karnataka', 'EFGHI5678J', '567890123456'),
('bob.dev@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Bob', 'Brown', '+91-9876543215', '1993-04-18', '2022-03-01', 'employee', 'active', 1, 2, 'Chennai, Tamil Nadu', 'FGHIJ6789K', '678901234567'),
('carol.dev@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Carol', 'Clark', '+91-9876543216', '1994-07-22', '2022-06-15', 'employee', 'active', 1, 2, 'Hyderabad, Telangana', 'GHIJK7890L', '789012345678'),
('david.dev@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'David', 'Davis', '+91-9876543217', '1991-11-30', '2021-09-01', 'employee', 'active', 1, 2, 'Pune, Maharashtra', 'HIJKL8901M', '890123456789'),

-- Employees - HR
('emma.hr@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Emma', 'Evans', '+91-9876543218', '1990-02-14', '2021-05-01', 'employee', 'active', 2, 3, 'Mumbai, Maharashtra', 'IJKLM9012N', '901234567890'),
('frank.hr@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Frank', 'Fisher', '+91-9876543219', '1992-06-28', '2022-02-15', 'employee', 'active', 2, 3, 'Mumbai, Maharashtra', 'JKLMN0123O', '012345678901'),

-- Employees - Sales
('grace.sales@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Grace', 'Green', '+91-9876543220', '1993-09-05', '2022-04-01', 'employee', 'active', 3, 4, 'Delhi, NCR', 'KLMNO1234P', '123456789013'),
('henry.sales@company.com', '$2b$10$y2eC/9m.SW9me84SekUlqO2ArOauQOvCk9j1BP4DWkZy87.ASsSAS', 'Henry', 'Harris', '+91-9876543221', '1991-12-16', '2021-11-15', 'employee', 'active', 3, 4, 'Delhi, NCR', 'LMNOP2345Q', '234567890124');

-- Insert leave balances for all active users for 2025
INSERT INTO leave_balances (user_id, year, sick_leave, casual_leave, earned_leave, comp_off, paternity_maternity)
SELECT id, 2025, 12.0, 12.0, 18.0, 2.0, 0.0
FROM users
WHERE status = 'active';

-- Insert holidays for 2025
INSERT INTO holidays (date, name, description, is_optional, year) VALUES
('2025-01-26', 'Republic Day', 'Republic Day of India', FALSE, 2025),
('2025-03-14', 'Holi', 'Festival of Colors', FALSE, 2025),
('2025-04-14', 'Ambedkar Jayanti', 'Dr. B.R. Ambedkar Birthday', TRUE, 2025),
('2025-04-18', 'Good Friday', 'Good Friday', TRUE, 2025),
('2025-05-01', 'May Day', 'International Workers Day', FALSE, 2025),
('2025-08-15', 'Independence Day', 'Independence Day of India', FALSE, 2025),
('2025-10-02', 'Gandhi Jayanti', 'Mahatma Gandhi Birthday', FALSE, 2025),
('2025-10-20', 'Dussehra', 'Vijaya Dashami', FALSE, 2025),
('2025-11-01', 'Diwali', 'Festival of Lights', FALSE, 2025),
('2025-11-02', 'Diwali Holiday', 'Day after Diwali', FALSE, 2025),
('2025-12-25', 'Christmas', 'Christmas Day', FALSE, 2025);

-- Insert salary details for employees
INSERT INTO employee_salary_details (
    user_id, employee_code, pan_number, bank_account_number, bank_name, bank_ifsc_code, bank_branch,
    pf_account_number, uan_number, basic_salary, hra_percentage, transport_allowance,
    other_allowances, pf_applicable, esi_applicable, professional_tax, tax_regime
) VALUES
(1, 'EMP001', 'ABCDE1234F', '1234567890123456', 'HDFC Bank', 'HDFC0001234', 'Bangalore Main', 'KA/BGP/123456/001', '100123456789', 75000.00, 40.0, 1600.00, 5000.00, TRUE, FALSE, 200.00, 'old'),
(2, 'EMP002', 'BCDEF2345G', '2345678901234567', 'ICICI Bank', 'ICIC0002345', 'Bangalore Koramangala', 'KA/BGP/123456/002', '100234567890', 65000.00, 40.0, 1600.00, 4000.00, TRUE, FALSE, 200.00, 'old'),
(3, 'EMP003', 'CDEFG3456H', '3456789012345678', 'SBI', 'SBIN0003456', 'Mumbai Andheri', 'MH/MUM/123456/001', '100345678901', 60000.00, 40.0, 1600.00, 3500.00, TRUE, FALSE, 200.00, 'new'),
(4, 'EMP004', 'DEFGH4567I', '4567890123456789', 'Axis Bank', 'UTIB0004567', 'Delhi CP', 'DL/DEL/123456/001', '100456789012', 55000.00, 40.0, 1600.00, 3000.00, TRUE, FALSE, 200.00, 'old'),
(5, 'EMP005', 'EFGHI5678J', '5678901234567890', 'HDFC Bank', 'HDFC0001234', 'Bangalore HSR', 'KA/BGP/123456/003', '100567890123', 50000.00, 40.0, 1600.00, 2500.00, TRUE, FALSE, 200.00, 'old'),
(6, 'EMP006', 'FGHIJ6789K', '6789012345678901', 'ICICI Bank', 'ICIC0002345', 'Chennai T Nagar', 'TN/CHE/123456/001', '100678901234', 48000.00, 40.0, 1600.00, 2000.00, TRUE, FALSE, 200.00, 'new'),
(7, 'EMP007', 'GHIJK7890L', '7890123456789012', 'SBI', 'SBIN0003456', 'Hyderabad Jubilee Hills', 'TS/HYD/123456/001', '100789012345', 45000.00, 40.0, 1600.00, 2000.00, TRUE, FALSE, 200.00, 'old'),
(8, 'EMP008', 'HIJKL8901M', '8901234567890123', 'Axis Bank', 'UTIB0004567', 'Pune Shivaji Nagar', 'MH/PUN/123456/001', '100890123456', 55000.00, 40.0, 1600.00, 3000.00, TRUE, FALSE, 200.00, 'old');

-- Insert sample leave requests
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, approver_id, approved_rejected_at, created_at) VALUES
(5, 'casual_leave', '2025-11-20', '2025-11-21', 2.0, 'Personal work at hometown', 'approved', 2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days'),
(6, 'sick_leave', '2025-11-18', '2025-11-18', 1.0, 'Fever and cold', 'approved', 2, NOW() - INTERVAL '6 days', NOW() - INTERVAL '8 days'),
(7, 'earned_leave', '2025-12-24', '2025-12-26', 3.0, 'Christmas vacation with family', 'pending', NULL, NULL, NOW() - INTERVAL '2 days'),
(9, 'casual_leave', '2025-12-01', '2025-12-02', 2.0, 'Wedding ceremony', 'pending', NULL, NULL, NOW() - INTERVAL '1 day');

-- Insert sample attendance for last week
INSERT INTO attendance (user_id, date, check_in_time, check_out_time, status, work_hours, is_late) VALUES
(1, CURRENT_DATE - 1, CURRENT_DATE - 1 + TIME '09:00:00', CURRENT_DATE - 1 + TIME '18:00:00', 'present', 9.0, FALSE),
(1, CURRENT_DATE - 2, CURRENT_DATE - 2 + TIME '09:15:00', CURRENT_DATE - 2 + TIME '18:30:00', 'present', 9.25, TRUE),
(2, CURRENT_DATE - 1, CURRENT_DATE - 1 + TIME '08:55:00', CURRENT_DATE - 1 + TIME '17:45:00', 'present', 8.83, FALSE),
(2, CURRENT_DATE - 2, CURRENT_DATE - 2 + TIME '09:00:00', CURRENT_DATE - 2 + TIME '18:15:00', 'present', 9.25, FALSE),
(5, CURRENT_DATE - 1, CURRENT_DATE - 1 + TIME '09:30:00', CURRENT_DATE - 1 + TIME '18:30:00', 'present', 9.0, TRUE),
(5, CURRENT_DATE - 2, CURRENT_DATE - 2 + TIME '09:05:00', CURRENT_DATE - 2 + TIME '18:00:00', 'present', 8.92, FALSE),
(6, CURRENT_DATE - 1, CURRENT_DATE - 1 + TIME '09:00:00', CURRENT_DATE - 1 + TIME '17:30:00', 'present', 8.5, FALSE),
(6, CURRENT_DATE - 2, CURRENT_DATE - 2 + TIME '09:10:00', CURRENT_DATE - 2 + TIME '18:00:00', 'present', 8.83, TRUE);

-- Insert sample advance salary requests
INSERT INTO advance_salary_requests (user_id, amount, reason, requested_for_month, requested_for_year, status, created_at) VALUES
(5, 25000.00, 'Medical emergency for family member', 12, 2025, 'pending', NOW() - INTERVAL '2 days'),
(6, 15000.00, 'Home renovation expenses', 12, 2025, 'approved', NOW() - INTERVAL '5 days'),
(8, 30000.00, 'Wedding expenses', 11, 2025, 'disbursed', NOW() - INTERVAL '10 days');

-- Update approved and disbursed requests
UPDATE advance_salary_requests SET approver_id = 2, approved_rejected_at = NOW() - INTERVAL '3 days' WHERE id = 2;
UPDATE advance_salary_requests SET approver_id = 2, approved_rejected_at = NOW() - INTERVAL '8 days', disbursed_by = 1, disbursed_at = NOW() - INTERVAL '5 days' WHERE id = 3;

-- Insert sample expenses
INSERT INTO expenses (user_id, category, amount, description, expense_date, status, created_at) VALUES
(5, 'travel', 2500.00, 'Cab fare for client meeting', '2025-11-15', 'approved', NOW() - INTERVAL '10 days'),
(5, 'food', 800.00, 'Team lunch', '2025-11-20', 'pending', NOW() - INTERVAL '3 days'),
(6, 'software', 5000.00, 'JetBrains IDE license', '2025-11-10', 'approved', NOW() - INTERVAL '15 days'),
(11, 'travel', 3500.00, 'Client visit travel expenses', '2025-11-18', 'pending', NOW() - INTERVAL '5 days'),
(12, 'accommodation', 4500.00, 'Hotel stay for conference', '2025-11-12', 'approved', NOW() - INTERVAL '12 days');

-- Update approved expenses
UPDATE expenses SET approver_id = 2, approved_rejected_at = NOW() - INTERVAL '8 days' WHERE id = 1;
UPDATE expenses SET approver_id = 2, approved_rejected_at = NOW() - INTERVAL '12 days' WHERE id = 3;
UPDATE expenses SET approver_id = 4, approved_rejected_at = NOW() - INTERVAL '10 days' WHERE id = 5;

-- Insert sample vendors
INSERT INTO vendors (name, contact_person, email, phone, address, gst_number, category, status) VALUES
('TechSupply India', 'Rajesh Kumar', 'rajesh@techsupply.in', '+91-9988776655', 'Electronic City, Bangalore', '29ABCDE1234F1Z5', 'IT Hardware', 'active'),
('Office Essentials', 'Priya Sharma', 'priya@officeessentials.com', '+91-9876543200', 'Koramangala, Bangalore', '29FGHIJ5678K1Z8', 'Office Supplies', 'active'),
('CloudServe Solutions', 'Amit Patel', 'amit@cloudserve.in', '+91-9123456789', 'Whitefield, Bangalore', '29LMNOP9012Q1Z2', 'Cloud Services', 'active'),
('FurniCraft', 'Meena Reddy', 'meena@furnicraft.in', '+91-8899001122', 'Marathahalli, Bangalore', '29RSTUV3456W1Z6', 'Furniture', 'active'),
('SecureTech', 'Vikram Singh', 'vikram@securetech.in', '+91-7788990011', 'Indiranagar, Bangalore', '29XYZAB7890C1Z9', 'Security Systems', 'inactive');

-- Insert sample inventory
INSERT INTO inventory (item_name, category, description, quantity, unit_price, total_value, status, assigned_to_user_id, purchase_date, serial_number, location) VALUES
('MacBook Pro 14"', 'Laptop', 'Apple MacBook Pro M3 Pro, 18GB RAM, 512GB SSD', 5, 199999.00, 999995.00, 'available', NULL, '2025-01-15', NULL, 'IT Storage Room'),
('Dell Monitor 27"', 'Monitor', 'Dell UltraSharp 27" 4K USB-C Monitor', 10, 45000.00, 450000.00, 'available', NULL, '2025-02-01', NULL, 'IT Storage Room'),
('ThinkPad X1 Carbon', 'Laptop', 'Lenovo ThinkPad X1 Carbon Gen 11', 1, 149999.00, 149999.00, 'assigned', 5, '2024-06-15', 'LNV-X1C-2024-001', 'Assigned to Employee'),
('MacBook Pro 14"', 'Laptop', 'Apple MacBook Pro M3, 16GB RAM, 512GB SSD', 1, 189999.00, 189999.00, 'assigned', 6, '2024-08-20', 'APL-MBP-2024-001', 'Assigned to Employee'),
('Office Chair', 'Furniture', 'Ergonomic office chair with lumbar support', 20, 12000.00, 240000.00, 'available', NULL, '2024-03-10', NULL, 'HR Store'),
('Standing Desk', 'Furniture', 'Electric height adjustable standing desk', 8, 25000.00, 200000.00, 'available', NULL, '2024-04-15', NULL, 'HR Store'),
('Logitech MX Master 3', 'Accessories', 'Wireless mouse for productivity', 15, 7500.00, 112500.00, 'available', NULL, '2025-01-05', NULL, 'IT Storage Room'),
('Mechanical Keyboard', 'Accessories', 'Cherry MX Blue mechanical keyboard', 10, 8000.00, 80000.00, 'available', NULL, '2025-01-05', NULL, 'IT Storage Room');

-- Insert payroll for October 2025
INSERT INTO payroll (user_id, month, year, basic_salary, hra, transport_allowance, other_allowances, gross_salary, pf_deduction, tax_deduction, total_deductions, net_salary, processed_by, processed_at) VALUES
(1, 10, 2025, 75000.00, 30000.00, 1600.00, 5000.00, 111600.00, 9000.00, 15000.00, 24200.00, 87400.00, 1, '2025-10-31'),
(2, 10, 2025, 65000.00, 26000.00, 1600.00, 4000.00, 96600.00, 7800.00, 12000.00, 20000.00, 76600.00, 1, '2025-10-31'),
(5, 10, 2025, 50000.00, 20000.00, 1600.00, 2500.00, 74100.00, 6000.00, 8000.00, 14200.00, 59900.00, 1, '2025-10-31'),
(6, 10, 2025, 48000.00, 19200.00, 1600.00, 2000.00, 70800.00, 5760.00, 7500.00, 13460.00, 57340.00, 1, '2025-10-31');

-- Insert payroll for November 2025
INSERT INTO payroll (user_id, month, year, basic_salary, hra, transport_allowance, other_allowances, gross_salary, pf_deduction, tax_deduction, total_deductions, net_salary, processed_by, processed_at) VALUES
(1, 11, 2025, 75000.00, 30000.00, 1600.00, 5000.00, 111600.00, 9000.00, 15000.00, 24200.00, 87400.00, 1, '2025-11-25'),
(2, 11, 2025, 65000.00, 26000.00, 1600.00, 4000.00, 96600.00, 7800.00, 12000.00, 20000.00, 76600.00, 1, '2025-11-25'),
(5, 11, 2025, 50000.00, 20000.00, 1600.00, 2500.00, 74100.00, 6000.00, 8000.00, 14200.00, 59900.00, 1, '2025-11-25'),
(6, 11, 2025, 48000.00, 19200.00, 1600.00, 2000.00, 70800.00, 5760.00, 7500.00, 13460.00, 57340.00, 1, '2025-11-25');

-- Insert sample daily reports
INSERT INTO daily_reports (user_id, report_date, title, description, status, submitted_at, created_at) VALUES
(5, CURRENT_DATE - 1, 'API Development Progress', 'Worked on implementing the user authentication API endpoints. Completed login, logout, and token refresh endpoints. Also started working on the password reset functionality.\n\nKey achievements:\n- Implemented JWT-based authentication\n- Added rate limiting to prevent brute force attacks\n- Wrote unit tests for auth endpoints', 'submitted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(5, CURRENT_DATE - 2, 'Database Schema Design', 'Designed and implemented the database schema for the new inventory management module. Created tables for products, stock movements, and material assignments.\n\nAlso reviewed the existing leave management schema and made some optimizations.', 'submitted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(6, CURRENT_DATE - 1, 'Frontend Dashboard Updates', 'Completed the dashboard redesign with new charts and widgets. Added real-time data refresh and improved the overall user experience.\n\nKey tasks:\n- Implemented ApexCharts for data visualization\n- Added dark mode support\n- Fixed responsive layout issues on mobile devices', 'submitted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(6, CURRENT_DATE - 2, 'Bug Fixes and Code Review', 'Fixed several bugs reported by QA team including the login redirect issue and date formatting problems. Also conducted code review for junior developers'' PRs.', 'submitted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(7, CURRENT_DATE - 1, 'Server Infrastructure Setup', 'Set up the staging environment on AWS. Configured EC2 instances, RDS database, and S3 buckets. Also implemented CI/CD pipeline using GitHub Actions.', 'submitted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(8, CURRENT_DATE, 'Daily Standup and Planning', 'Attended the daily standup meeting and sprint planning session. Identified tasks for the week and assigned them to team members.', 'draft', NULL, NOW());

-- Material Assignments table (for lending equipment to employees)
CREATE TABLE IF NOT EXISTS material_assignments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
    assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    purpose TEXT,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    returned_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'overdue', 'returned', 'lost', 'damaged')),
    return_condition VARCHAR(20) CHECK (return_condition IN ('good', 'damaged', 'lost')),
    condition_notes TEXT,
    reminder_sent_before BOOLEAN DEFAULT FALSE,
    reminder_sent_due BOOLEAN DEFAULT FALSE,
    last_overdue_reminder TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_assignments_status ON material_assignments(status);
CREATE INDEX IF NOT EXISTS idx_material_assignments_due_date ON material_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_material_assignments_assigned_to ON material_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_material_assignments_product ON material_assignments(product_id);

-- Trigger for material_assignments updated_at
CREATE TRIGGER update_material_assignments_updated_at BEFORE UPDATE ON material_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE MANAGEMENT TABLES
-- ============================================================================

-- Storage Folders table (for nested folder structure)
CREATE TABLE IF NOT EXISTS storage_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES storage_folders(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    path VARCHAR(1000) NOT NULL, -- Full path like /Documents/Projects/2024
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storage_folders_owner ON storage_folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_storage_folders_parent ON storage_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_storage_folders_path ON storage_folders(path);

-- Storage Files table (with S3 integration)
CREATE TABLE IF NOT EXISTS storage_files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    folder_id INTEGER REFERENCES storage_folders(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id),

    -- S3 info
    s3_key VARCHAR(500) NOT NULL UNIQUE,
    s3_url VARCHAR(1000),

    -- File metadata
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),

    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    public_token VARCHAR(64) UNIQUE,
    public_expires_at TIMESTAMPTZ,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storage_files_owner ON storage_files(owner_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_folder ON storage_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_public_token ON storage_files(public_token);

-- Storage Shares table (for sharing files/folders with users)
CREATE TABLE IF NOT EXISTS storage_shares (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES storage_files(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES storage_folders(id) ON DELETE CASCADE,
    shared_with INTEGER NOT NULL REFERENCES users(id),
    shared_by INTEGER NOT NULL REFERENCES users(id),
    permission VARCHAR(20) DEFAULT 'view', -- 'view' or 'edit'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT share_target CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL) OR
        (file_id IS NULL AND folder_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_storage_shares_shared_with ON storage_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_storage_shares_file ON storage_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_storage_shares_folder ON storage_shares(folder_id);

-- Triggers for storage tables
CREATE TRIGGER update_storage_folders_updated_at BEFORE UPDATE ON storage_folders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_files_updated_at BEFORE UPDATE ON storage_files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
