import { Router } from 'express';
import {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  getVoucherByNumber,
  markVoucherAsUsed,
  deleteVoucher,
  getRegions,
} from '../controllers/voucher.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/vouchers/regions
 * @desc    Get list of available regions
 * @access  Private (All authenticated users)
 */
router.get('/regions', getRegions);

/**
 * @route   GET /api/vouchers/verify/:voucherNumber
 * @desc    Get voucher by voucher number (for QR code verification)
 * @access  Private (All authenticated users)
 */
router.get('/verify/:voucherNumber', getVoucherByNumber);

/**
 * @route   POST /api/vouchers
 * @desc    Create/Generate a new voucher
 * @access  Private (All authenticated users)
 */
router.post('/', createVoucher);

/**
 * @route   GET /api/vouchers
 * @desc    Get all vouchers (filtered by role)
 * @access  Private (All authenticated users)
 */
router.get('/', getAllVouchers);

/**
 * @route   GET /api/vouchers/:id
 * @desc    Get voucher by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', getVoucherById);

/**
 * @route   PUT /api/vouchers/:id/use
 * @desc    Mark voucher as used
 * @access  Private (All authenticated users)
 */
router.put('/:id/use', markVoucherAsUsed);

/**
 * @route   DELETE /api/vouchers/:id
 * @desc    Delete voucher
 * @access  Private (Creator or Admin)
 */
router.delete('/:id', deleteVoucher);

export default router;
