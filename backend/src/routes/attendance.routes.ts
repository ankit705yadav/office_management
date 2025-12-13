import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getTeamAttendance,
  getMonthlyAttendance,
  exportAttendanceReport,
  requestRegularization,
  getRegularizations,
  approveRegularization,
  rejectRegularization,
  getAttendanceSettings,
  updateAttendanceSettings,
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireManagerOrAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Check-in/Check-out Routes
// ============================================

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in for the day
 * @access  Private (All authenticated users)
 * @body    { location?: string }
 */
router.post('/check-in', checkIn);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out for the day
 * @access  Private (All authenticated users)
 * @body    { location?: string }
 */
router.post('/check-out', checkOut);

// ============================================
// Attendance Records Routes
// ============================================

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance record
 * @access  Private (All authenticated users)
 */
router.get('/today', getTodayAttendance);

/**
 * @route   GET /api/attendance/my
 * @desc    Get my attendance records
 * @access  Private (All authenticated users)
 * @query   { startDate?: string, endDate?: string, status?: string, page?: number, limit?: number }
 */
router.get('/my', getMyAttendance);

/**
 * @route   GET /api/attendance/team
 * @desc    Get team attendance for a specific date
 * @access  Private (Manager/Admin only)
 * @query   { date?: string }
 */
router.get('/team', requireManagerOrAdmin, getTeamAttendance);

/**
 * @route   GET /api/attendance/monthly
 * @desc    Get monthly attendance summary
 * @access  Private (All authenticated users)
 * @query   { month?: number, year?: number }
 */
router.get('/monthly', getMonthlyAttendance);

/**
 * @route   GET /api/attendance/export
 * @desc    Export attendance report to CSV
 * @access  Private (All authenticated users)
 * @query   { startDate?: string, endDate?: string, status?: string, userId?: number }
 */
router.get('/export', exportAttendanceReport);

// ============================================
// Regularization Routes
// ============================================

/**
 * @route   POST /api/attendance/regularize
 * @desc    Request attendance regularization
 * @access  Private (All authenticated users)
 * @body    { date: string, requestedCheckIn?: string, requestedCheckOut?: string, reason: string, location?: string }
 */
router.post('/regularize', requestRegularization);

/**
 * @route   GET /api/attendance/regularizations
 * @desc    Get regularization requests
 * @access  Private (All authenticated users - filtered by role)
 * @query   { status?: string, page?: number, limit?: number }
 */
router.get('/regularizations', getRegularizations);

/**
 * @route   PUT /api/attendance/regularizations/:id/approve
 * @desc    Approve regularization request
 * @access  Private (Manager/Admin only)
 * @body    { comments?: string }
 */
router.put(
  '/regularizations/:id/approve',
  requireManagerOrAdmin,
  approveRegularization
);

/**
 * @route   PUT /api/attendance/regularizations/:id/reject
 * @desc    Reject regularization request
 * @access  Private (Manager/Admin only)
 * @body    { comments: string }
 */
router.put(
  '/regularizations/:id/reject',
  requireManagerOrAdmin,
  rejectRegularization
);

// ============================================
// Settings Routes
// ============================================

/**
 * @route   GET /api/attendance/settings
 * @desc    Get attendance settings
 * @access  Private (All authenticated users)
 */
router.get('/settings', getAttendanceSettings);

/**
 * @route   PUT /api/attendance/settings
 * @desc    Update attendance settings
 * @access  Private (Admin only)
 * @body    { departmentId?: number, workStartTime?: string, workEndTime?: string, gracePeriodMinutes?: number, halfDayHours?: number, fullDayHours?: number, workingDays?: number[], autoCheckoutEnabled?: boolean, autoCheckoutTime?: string, locationTrackingEnabled?: boolean }
 */
router.put('/settings', requireAdmin, updateAttendanceSettings);

export default router;
