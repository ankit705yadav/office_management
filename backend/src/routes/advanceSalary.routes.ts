import { Router } from 'express';
import {
  requestAdvance,
  getAllAdvanceRequests,
  getMyAdvanceRequests,
  getPendingAdvanceRequests,
  approveAdvance,
  rejectAdvance,
  markAsDisbursed,
  cancelAdvanceRequest,
  getAdvanceSalarySummary,
} from '../controllers/advanceSalary.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin, requireAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/advance-salary/summary
 * @desc    Get advance salary summary
 * @access  Private (Manager/Admin)
 */
router.get('/summary', requireManagerOrAdmin, getAdvanceSalarySummary);

/**
 * @route   GET /api/advance-salary/my-requests
 * @desc    Get current user's advance requests
 * @access  Private (All authenticated users)
 */
router.get('/my-requests', getMyAdvanceRequests);

/**
 * @route   GET /api/advance-salary/pending
 * @desc    Get pending advance requests for approval
 * @access  Private (Manager/Admin)
 */
router.get('/pending', requireManagerOrAdmin, getPendingAdvanceRequests);

/**
 * @route   POST /api/advance-salary
 * @desc    Request salary advance
 * @access  Private (All authenticated users)
 */
router.post('/', requestAdvance);

/**
 * @route   GET /api/advance-salary
 * @desc    Get all advance requests (filtered by role)
 * @access  Private (All authenticated users)
 */
router.get('/', getAllAdvanceRequests);

/**
 * @route   PUT /api/advance-salary/:id/approve
 * @desc    Approve advance request
 * @access  Private (Manager/Admin)
 */
router.put('/:id/approve', requireManagerOrAdmin, approveAdvance);

/**
 * @route   PUT /api/advance-salary/:id/reject
 * @desc    Reject advance request
 * @access  Private (Manager/Admin)
 */
router.put('/:id/reject', requireManagerOrAdmin, rejectAdvance);

/**
 * @route   PUT /api/advance-salary/:id/disburse
 * @desc    Mark advance as disbursed
 * @access  Private (Admin only)
 */
router.put('/:id/disburse', requireAdmin, markAsDisbursed);

/**
 * @route   PUT /api/advance-salary/:id/cancel
 * @desc    Cancel advance request
 * @access  Private (Self or Admin)
 */
router.put('/:id/cancel', cancelAdvanceRequest);

export default router;
