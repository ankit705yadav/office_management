-- Add advance_salary_requests table for salary advance requests
CREATE TABLE IF NOT EXISTS advance_salary_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    requested_for_month INTEGER NOT NULL CHECK (requested_for_month >= 1 AND requested_for_month <= 12),
    requested_for_year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'cancelled')),
    approver_id INTEGER REFERENCES users(id),
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    disbursed_by INTEGER REFERENCES users(id),
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_advance_salary_user_id ON advance_salary_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_salary_status ON advance_salary_requests(status);
CREATE INDEX IF NOT EXISTS idx_advance_salary_approver_id ON advance_salary_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_advance_salary_month_year ON advance_salary_requests(requested_for_month, requested_for_year);

-- Update notifications type constraint to include advance_salary
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error', 'birthday', 'anniversary', 'leave', 'attendance', 'expense', 'advance_salary', 'payroll'));
