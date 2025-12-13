import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  submitExpense,
  getAllExpenses,
  getMyExpenses,
  getPendingExpenses,
  getExpenseById,
  updateExpense,
  approveExpense,
  rejectExpense,
  cancelExpense,
  getExpenseSummary,
  exportExpenseReport,
  deleteExpense,
} from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin } from '../middleware/roleCheck';

const router = Router();

// Ensure uploads/receipts directory exists
const uploadsDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for receipt file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/expenses/my-expenses
 * @desc    Get current user's expenses
 * @access  Private (All authenticated users)
 */
router.get('/my-expenses', getMyExpenses);

/**
 * @route   GET /api/expenses/pending
 * @desc    Get pending expenses for approval
 * @access  Private (Manager/Admin)
 */
router.get('/pending', requireManagerOrAdmin, getPendingExpenses);

/**
 * @route   GET /api/expenses/summary
 * @desc    Get expense summary/stats
 * @access  Private (All authenticated users)
 */
router.get('/summary', getExpenseSummary);

/**
 * @route   GET /api/expenses/export
 * @desc    Export expense report to CSV
 * @access  Private (All authenticated users)
 */
router.get('/export', exportExpenseReport);

/**
 * @route   POST /api/expenses
 * @desc    Submit expense claim with optional receipt upload
 * @access  Private (All authenticated users)
 */
router.post('/', upload.single('receipt'), submitExpense);

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses (filtered by role)
 * @access  Private (All authenticated users)
 */
router.get('/', getAllExpenses);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get('/:id', getExpenseById);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense (only pending)
 * @access  Private (Owner only)
 */
router.put('/:id', upload.single('receipt'), updateExpense);

/**
 * @route   PUT /api/expenses/:id/approve
 * @desc    Approve expense
 * @access  Private (Manager/Admin)
 */
router.put('/:id/approve', requireManagerOrAdmin, approveExpense);

/**
 * @route   PUT /api/expenses/:id/reject
 * @desc    Reject expense
 * @access  Private (Manager/Admin)
 */
router.put('/:id/reject', requireManagerOrAdmin, rejectExpense);

/**
 * @route   PUT /api/expenses/:id/cancel
 * @desc    Cancel expense
 * @access  Private (Owner or Admin)
 */
router.put('/:id/cancel', cancelExpense);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', deleteExpense);

export default router;
