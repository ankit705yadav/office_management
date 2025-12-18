import { Router } from 'express';
import {
  applyLeave,
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  cancelLeave,
  getLeaveHistory,
  exportLeaveReport,
} from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/leaves/balance
 * @desc    Get leave balance for user
 * @access  Private (Self or Manager/Admin)
 */
router.get('/balance', getLeaveBalance);

/**
 * @route   GET /api/leaves/history
 * @desc    Get leave history (past leaves)
 * @access  Private (All authenticated users)
 */
router.get('/history', getLeaveHistory);

/**
 * @route   GET /api/leaves/export
 * @desc    Export leave report to CSV
 * @access  Private (All authenticated users)
 */
router.get('/export', exportLeaveReport);

/**
 * @route   POST /api/leaves
 * @desc    Apply for leave with optional document link
 * @access  Private (All authenticated users)
 */
router.post('/', applyLeave);

/**
 * @route   GET /api/leaves
 * @desc    Get all leave requests (filtered by role)
 * @access  Private (All authenticated users)
 */
router.get('/', getAllLeaveRequests);

/**
 * @route   GET /api/leaves/:id
 * @desc    Get leave request by ID
 * @access  Private
 */
router.get('/:id', getLeaveRequestById);

/**
 * @route   PUT /api/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Manager/Admin)
 */
router.put('/:id/approve', requireManagerOrAdmin, approveLeave);

/**
 * @route   PUT /api/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Manager/Admin)
 */
router.put('/:id/reject', requireManagerOrAdmin, rejectLeave);

/**
 * @route   PUT /api/leaves/:id/cancel
 * @desc    Cancel leave request
 * @access  Private (Self or Admin)
 */
router.put('/:id/cancel', cancelLeave);

export default router;
