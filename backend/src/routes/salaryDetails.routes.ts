import { Router } from 'express';
import {
  createSalaryDetails,
  getSalaryDetails,
  getAllSalaryDetails,
  updateSalaryDetails,
  deleteSalaryDetails,
  getEmployeesWithoutSalary,
  bulkImportSalaryDetails,
} from '../controllers/salaryDetails.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { validateRequest } from '../middleware/validateRequest';
import {
  createSalaryDetailsValidation,
  updateSalaryDetailsValidation,
} from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/salary-details/employees/without-salary
 * @desc    Get employees without salary setup
 * @access  Private (Admin only)
 */
router.get('/employees/without-salary', requireAdmin, getEmployeesWithoutSalary);

/**
 * @route   POST /api/salary-details/bulk-import
 * @desc    Bulk import salary details
 * @access  Private (Admin only)
 */
router.post('/bulk-import', requireAdmin, bulkImportSalaryDetails);

/**
 * @route   POST /api/salary-details
 * @desc    Create salary details for an employee
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, createSalaryDetailsValidation, validateRequest, createSalaryDetails);

/**
 * @route   GET /api/salary-details
 * @desc    Get all salary details
 * @access  Private (Admin only)
 */
router.get('/', requireAdmin, getAllSalaryDetails);

/**
 * @route   GET /api/salary-details/:userId
 * @desc    Get salary details by user ID
 * @access  Private (Admin or Self)
 */
router.get('/:userId', getSalaryDetails);

/**
 * @route   PUT /api/salary-details/:userId
 * @desc    Update salary details
 * @access  Private (Admin only)
 */
router.put('/:userId', requireAdmin, updateSalaryDetailsValidation, validateRequest, updateSalaryDetails);

/**
 * @route   DELETE /api/salary-details/:userId
 * @desc    Delete salary details
 * @access  Private (Admin only)
 */
router.delete('/:userId', requireAdmin, deleteSalaryDetails);

export default router;
