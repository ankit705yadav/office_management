import { Router } from 'express';
import {
  generatePayroll,
  getPayrollRecords,
  getMyPayslips,
  getPayrollById,
  downloadPayslip,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
} from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { validateRequest } from '../middleware/validateRequest';
import { generatePayrollValidation } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/payroll/my-payslips
 * @desc    Get current user's payslips
 * @access  Private (All authenticated users)
 */
router.get('/my-payslips', getMyPayslips);

/**
 * @route   GET /api/payroll/summary
 * @desc    Get payroll summary (aggregated data)
 * @access  Private (Role-based filtering)
 */
router.get('/summary', getPayrollSummary);

/**
 * @route   POST /api/payroll/generate
 * @desc    Generate payroll for month/year
 * @access  Private (Admin only)
 */
router.post('/generate', requireAdmin, generatePayrollValidation, validateRequest, generatePayroll);

/**
 * @route   GET /api/payroll
 * @desc    Get all payroll records (role-based filtering)
 * @access  Private (All authenticated users)
 */
router.get('/', getPayrollRecords);

/**
 * @route   GET /api/payroll/:id
 * @desc    Get payroll record by ID
 * @access  Private (Role-based access)
 */
router.get('/:id', getPayrollById);

/**
 * @route   GET /api/payroll/:id/download
 * @desc    Download payslip PDF
 * @access  Private (Role-based access)
 */
router.get('/:id/download', downloadPayslip);

/**
 * @route   PUT /api/payroll/:id
 * @desc    Update payroll record
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, updatePayroll);

/**
 * @route   DELETE /api/payroll/:id
 * @desc    Delete payroll record
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, deletePayroll);

export default router;
