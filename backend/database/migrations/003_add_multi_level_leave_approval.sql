-- Migration: Add Multi-Level Leave Approval System
-- This creates a leave_approvals table to track individual approvals in a chain

-- Create leave_approvals table to track each approval in the chain
CREATE TABLE IF NOT EXISTS leave_approvals (
    id SERIAL PRIMARY KEY,
    leave_request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id INTEGER NOT NULL REFERENCES users(id),
    approval_order INTEGER NOT NULL, -- Order in the approval chain (1 = first approver, 2 = second, etc.)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    acted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leave_request_id, approver_id) -- Each approver can only have one approval record per request
);

-- Add index for faster queries
CREATE INDEX idx_leave_approvals_leave_request ON leave_approvals(leave_request_id);
CREATE INDEX idx_leave_approvals_approver ON leave_approvals(approver_id);
CREATE INDEX idx_leave_approvals_status ON leave_approvals(status);

-- Add column to leave_requests to track current approval level
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS total_approval_levels INTEGER DEFAULT 0;

-- Update existing leave requests to have default approval levels
UPDATE leave_requests
SET current_approval_level = CASE
    WHEN status = 'approved' THEN 1
    WHEN status = 'rejected' THEN 0
    ELSE 0
END,
total_approval_levels = 1
WHERE current_approval_level IS NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leave_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_leave_approvals_updated_at ON leave_approvals;
CREATE TRIGGER trigger_leave_approvals_updated_at
    BEFORE UPDATE ON leave_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_approvals_updated_at();
