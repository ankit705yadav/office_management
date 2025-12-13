-- Migration: Add half-day leave support
-- Date: 2025-11-18
-- Description: Add is_half_day and half_day_session fields to support half-day leaves

-- Add is_half_day flag
ALTER TABLE leave_requests
ADD COLUMN is_half_day BOOLEAN DEFAULT FALSE;

-- Add half_day_session enum type
CREATE TYPE half_day_session AS ENUM ('morning', 'afternoon');

-- Add half_day_session column (nullable, only required when is_half_day is true)
ALTER TABLE leave_requests
ADD COLUMN half_day_session half_day_session;

-- Add comment for documentation
COMMENT ON COLUMN leave_requests.is_half_day IS 'Indicates if this is a half-day leave request';
COMMENT ON COLUMN leave_requests.half_day_session IS 'Session for half-day leave: morning or afternoon';
