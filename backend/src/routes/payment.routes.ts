import { Router } from 'express';
import {
  setSalary,
  getAllSalaries,
  getEmployeeSalary,
  runBulkPayroll,
  getAllPayments,
  updatePayment,
  bulkUpdatePayments,
  getMySalary,
  getMyPayments,
  getEmployeesWithoutSalary,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== EMPLOYEE ROUTES ====================
// Get own salary
router.get('/my-salary', getMySalary);

// Get own payment history
router.get('/my-payments', getMyPayments);

// ==================== ADMIN ROUTES ====================
// Get employees without salary (for dropdown)
router.get('/employees-without-salary', requireAdmin, getEmployeesWithoutSalary);

// Salary management
router.post('/salaries', requireAdmin, setSalary);
router.get('/salaries', requireAdmin, getAllSalaries);
router.get('/salaries/:userId', requireAdmin, getEmployeeSalary);

// Payment management
router.get('/', requireAdmin, getAllPayments);
router.post('/run-payroll', requireAdmin, runBulkPayroll);
router.put('/bulk-update', requireAdmin, bulkUpdatePayments);
router.put('/:id', requireAdmin, updatePayment);

export default router;
