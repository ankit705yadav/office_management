-- Migration: Add Attendance Management System
-- Description: Creates tables for attendance tracking, regularization requests, and settings
-- Author: Claude Code
-- Date: 2025-11-18

-- ============================================
-- STEP 1: Create ENUM types
-- ============================================

-- Attendance status enum
CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'half_day',
    'on_leave',
    'weekend',
    'holiday'
);

-- Regularization status enum
CREATE TYPE regularization_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

-- ============================================
-- STEP 2: Create attendance table
-- ============================================

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_location VARCHAR(500),  -- GPS coordinates or address
    check_out_location VARCHAR(500),
    status attendance_status DEFAULT 'absent',
    work_hours DECIMAL(4, 2) DEFAULT 0.0,  -- Total hours worked (e.g., 8.50)
    is_late BOOLEAN DEFAULT FALSE,
    is_early_departure BOOLEAN DEFAULT FALSE,
    notes TEXT,  -- Optional notes by employee
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one attendance record per user per day
    UNIQUE(user_id, date)
);

-- ============================================
-- STEP 3: Create attendance regularization table
-- ============================================

CREATE TABLE attendance_regularizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    requested_check_in TIMESTAMP,
    requested_check_out TIMESTAMP,
    requested_location VARCHAR(500),
    reason TEXT NOT NULL,
    status regularization_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_rejected_at TIMESTAMP,
    comments TEXT,  -- Manager's comments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 4: Create attendance settings table
-- ============================================

CREATE TABLE attendance_settings (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,

    -- Office timings
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '18:00:00',

    -- Grace period and rules
    grace_period_minutes INTEGER DEFAULT 10,  -- Grace period for late arrival
    half_day_hours DECIMAL(3, 1) DEFAULT 4.0,  -- Minimum hours for half day
    full_day_hours DECIMAL(3, 1) DEFAULT 8.0,  -- Minimum hours for full day

    -- Working days (0 = Sunday, 6 = Saturday)
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],  -- Monday to Friday

    -- Auto-checkout settings
    auto_checkout_enabled BOOLEAN DEFAULT FALSE,
    auto_checkout_time TIME DEFAULT '18:00:00',

    -- Location tracking
    location_tracking_enabled BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One settings record per department (NULL for company-wide default)
    UNIQUE(department_id)
);

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

-- Attendance indexes
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);

-- Regularization indexes
CREATE INDEX idx_regularizations_user_id ON attendance_regularizations(user_id);
CREATE INDEX idx_regularizations_status ON attendance_regularizations(status);
CREATE INDEX idx_regularizations_approver_id ON attendance_regularizations(approver_id);
CREATE INDEX idx_regularizations_date ON attendance_regularizations(date);

-- Settings indexes
CREATE INDEX idx_attendance_settings_department ON attendance_settings(department_id);

-- ============================================
-- STEP 6: Insert default company-wide settings
-- ============================================

-- Insert default settings (department_id = NULL means company-wide)
INSERT INTO attendance_settings (
    department_id,
    work_start_time,
    work_end_time,
    grace_period_minutes,
    half_day_hours,
    full_day_hours,
    working_days,
    auto_checkout_enabled,
    auto_checkout_time,
    location_tracking_enabled
) VALUES (
    NULL,  -- Company-wide default
    '09:00:00',
    '18:00:00',
    10,  -- 10 minutes grace period
    4.0,
    8.0,
    ARRAY[1,2,3,4,5],  -- Monday to Friday
    FALSE,
    '18:00:00',
    TRUE
);

-- ============================================
-- STEP 7: Comments for documentation
-- ============================================

COMMENT ON TABLE attendance IS 'Daily attendance records for all employees';
COMMENT ON TABLE attendance_regularizations IS 'Requests to regularize missed or incorrect attendance';
COMMENT ON TABLE attendance_settings IS 'Configurable attendance rules per department or company-wide';

COMMENT ON COLUMN attendance.check_in_location IS 'GPS coordinates or address where employee checked in';
COMMENT ON COLUMN attendance.work_hours IS 'Total hours worked calculated from check-in/out times';
COMMENT ON COLUMN attendance.is_late IS 'Flag indicating if employee arrived late (beyond grace period)';
COMMENT ON COLUMN attendance.is_early_departure IS 'Flag indicating if employee left early';

COMMENT ON COLUMN attendance_settings.working_days IS 'Array of working days (0=Sunday, 1=Monday, ..., 6=Saturday)';
COMMENT ON COLUMN attendance_settings.auto_checkout_enabled IS 'Automatically check out users at end of day';
COMMENT ON COLUMN attendance_settings.location_tracking_enabled IS 'Enable GPS location tracking for check-in/out';

-- ============================================
-- Migration complete!
-- ============================================
