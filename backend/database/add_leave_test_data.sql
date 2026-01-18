-- Add test data for leaves (Current Leaves and Leave History)
-- Run this after seed.sql to add more leave data

-- =====================================================
-- ADDITIONAL LEAVE REQUESTS
-- =====================================================

-- Current/Pending Leaves (upcoming dates - 2026)
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, approver_id, is_half_day, half_day_session, created_at, updated_at) VALUES
-- Pending leaves for different users
(7, 'sick_leave', '2026-01-20', '2026-01-21', 2, 'Feeling unwell, need rest', 'pending', NULL, false, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(7, 'casual_leave', '2026-01-25', '2026-01-25', 0.5, 'Bank work in the morning', 'pending', NULL, true, 'first_half', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(8, 'earned_leave', '2026-02-10', '2026-02-14', 5, 'Family vacation to Goa', 'pending', NULL, false, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(9, 'sick_leave', '2026-01-22', '2026-01-22', 1, 'Doctor appointment for checkup', 'pending', NULL, false, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- Approved current leaves
(7, 'casual_leave', '2026-01-15', '2026-01-17', 3, 'Attending cousin wedding', 'approved', 2, false, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(8, 'sick_leave', '2026-01-18', '2026-01-18', 1, 'Migraine issue', 'approved', 2, false, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(10, 'casual_leave', '2026-01-19', '2026-01-19', 0.5, 'Personal work', 'approved', 4, true, 'second_half', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Rejected leaves
(7, 'earned_leave', '2026-03-01', '2026-03-05', 5, 'Vacation plans', 'rejected', 2, false, NULL, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(9, 'casual_leave', '2026-02-01', '2026-02-03', 3, 'Short trip', 'rejected', 4, false, NULL, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- =====================================================
-- LEAVE HISTORY (Past dates - 2025)
-- =====================================================
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, approver_id, approved_rejected_at, is_half_day, half_day_session, created_at, updated_at) VALUES
-- Approved past leaves (history)
(7, 'sick_leave', '2025-06-10', '2025-06-12', 3, 'Fever and cold', 'approved', 2, '2025-06-09 10:00:00', false, NULL, '2025-06-08 09:00:00', '2025-06-09 10:00:00'),
(7, 'casual_leave', '2025-07-20', '2025-07-22', 3, 'Hometown visit', 'approved', 2, '2025-07-18 11:00:00', false, NULL, '2025-07-15 09:00:00', '2025-07-18 11:00:00'),
(7, 'earned_leave', '2025-09-05', '2025-09-10', 5, 'Annual family vacation', 'approved', 2, '2025-08-28 14:00:00', false, NULL, '2025-08-25 09:00:00', '2025-08-28 14:00:00'),
(7, 'sick_leave', '2025-10-15', '2025-10-15', 0.5, 'Dental appointment', 'approved', 2, '2025-10-14 16:00:00', true, 'first_half', '2025-10-12 09:00:00', '2025-10-14 16:00:00'),
(7, 'casual_leave', '2025-11-25', '2025-11-26', 2, 'Diwali celebration extended', 'approved', 2, '2025-11-20 10:00:00', false, NULL, '2025-11-18 09:00:00', '2025-11-20 10:00:00'),

(8, 'casual_leave', '2025-05-15', '2025-05-17', 3, 'Wedding in family', 'approved', 2, '2025-05-10 12:00:00', false, NULL, '2025-05-08 09:00:00', '2025-05-10 12:00:00'),
(8, 'sick_leave', '2025-08-20', '2025-08-21', 2, 'Food poisoning', 'approved', 2, '2025-08-19 14:00:00', false, NULL, '2025-08-19 08:00:00', '2025-08-19 14:00:00'),
(8, 'earned_leave', '2025-12-23', '2025-12-27', 4, 'Christmas vacation', 'approved', 2, '2025-12-15 10:00:00', false, NULL, '2025-12-10 09:00:00', '2025-12-15 10:00:00'),

(9, 'sick_leave', '2025-04-10', '2025-04-11', 2, 'Viral infection', 'approved', 4, '2025-04-09 11:00:00', false, NULL, '2025-04-08 09:00:00', '2025-04-09 11:00:00'),
(9, 'casual_leave', '2025-06-25', '2025-06-25', 1, 'Personal errands', 'approved', 4, '2025-06-23 15:00:00', false, NULL, '2025-06-22 09:00:00', '2025-06-23 15:00:00'),

(10, 'casual_leave', '2025-03-20', '2025-03-21', 2, 'House shifting', 'approved', 4, '2025-03-18 10:00:00', false, NULL, '2025-03-15 09:00:00', '2025-03-18 10:00:00'),
(10, 'earned_leave', '2025-07-01', '2025-07-05', 5, 'Summer vacation', 'approved', 4, '2025-06-25 14:00:00', false, NULL, '2025-06-20 09:00:00', '2025-06-25 14:00:00'),

-- Some rejected/cancelled history
(7, 'earned_leave', '2025-08-15', '2025-08-20', 5, 'Long weekend trip', 'rejected', 2, '2025-08-10 10:00:00', false, NULL, '2025-08-05 09:00:00', '2025-08-10 10:00:00'),
(8, 'casual_leave', '2025-09-01', '2025-09-02', 2, 'Personal work', 'cancelled', NULL, NULL, false, NULL, '2025-08-28 09:00:00', '2025-08-29 09:00:00'),
(9, 'sick_leave', '2025-07-10', '2025-07-12', 3, 'Not feeling well', 'rejected', 4, '2025-07-09 11:00:00', false, NULL, '2025-07-08 09:00:00', '2025-07-09 11:00:00');

-- =====================================================
-- UPDATE LEAVE BALANCES (deduct approved leaves)
-- =====================================================
-- For user 7 (2026 approved leaves: 3 casual)
-- For user 8 (2026 approved leaves: 1 sick)
-- Note: These are current year (2026) leaves

-- Create 2026 leave balances if not exists
INSERT INTO leave_balances (user_id, year, casual_leave, sick_leave, earned_leave, comp_off, paternity_maternity, birthday_leave)
SELECT id, 2026, 12, 12, 15, 0, 0, 1
FROM users WHERE status = 'active'
ON CONFLICT (user_id, year) DO NOTHING;

-- Update 2026 balances for approved current leaves
UPDATE leave_balances SET casual_leave = casual_leave - 3 WHERE user_id = 7 AND year = 2026 AND casual_leave >= 3;
UPDATE leave_balances SET sick_leave = sick_leave - 1 WHERE user_id = 8 AND year = 2026 AND sick_leave >= 1;
UPDATE leave_balances SET casual_leave = casual_leave - 0.5 WHERE user_id = 10 AND year = 2026 AND casual_leave >= 0.5;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'Leave Test Data Added Successfully!' as status;
SELECT 'Total Leave Requests: ' || COUNT(*) as count FROM leave_requests;
SELECT 'Pending: ' || COUNT(*) FROM leave_requests WHERE status = 'pending';
SELECT 'Approved: ' || COUNT(*) FROM leave_requests WHERE status = 'approved';
SELECT 'Rejected: ' || COUNT(*) FROM leave_requests WHERE status = 'rejected';
SELECT 'Cancelled: ' || COUNT(*) FROM leave_requests WHERE status = 'cancelled';
