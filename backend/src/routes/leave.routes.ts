import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
import { validateRequest } from '../middleware/validateRequest';
import { leaveRequestValidation } from '../utils/validators';

const router = Router();

// Ensure uploads/medical-documents directory exists
const uploadsDir = path.join(__dirname, '../../uploads/medical-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for medical document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `medical-doc-${uniqueSuffix}${ext}`);
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
 * @desc    Apply for leave with optional medical document upload
 * @access  Private (All authenticated users)
 */
router.post('/', upload.single('document'), applyLeave);

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
