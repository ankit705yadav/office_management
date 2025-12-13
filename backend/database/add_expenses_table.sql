-- Migration: Add expenses table
-- Run this if the expenses table doesn't exist

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    category expense_category NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expenses_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_approver_id ON expenses(approver_id);

-- Update notifications type constraint to include 'expense'
-- First check if constraint exists and drop it, then recreate with expense type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check') THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
        CHECK (type IN ('info', 'success', 'warning', 'error', 'birthday', 'anniversary', 'leave', 'attendance', 'expense'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
