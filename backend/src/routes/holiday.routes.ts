import { Router } from 'express';
import multer from 'multer';
import {
  getAllHolidays,
  getUpcomingHolidays,
  getHolidayById,
  createHoliday,
  bulkCreateHolidays,
  updateHoliday,
  deleteHoliday,
  importHolidaysFromCSV,
  downloadCSVTemplate,
} from '../controllers/holiday.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// Configure multer for CSV file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/holidays/template
 * @desc    Download CSV template
 * @access  Private (Admin only)
 */
router.get('/template', requireAdmin, downloadCSVTemplate);

/**
 * @route   GET /api/holidays/upcoming
 * @desc    Get upcoming holidays
 * @access  Private (All authenticated users)
 */
router.get('/upcoming', getUpcomingHolidays);

/**
 * @route   GET /api/holidays
 * @desc    Get all holidays for a year
 * @access  Private (All authenticated users)
 */
router.get('/', getAllHolidays);

/**
 * @route   GET /api/holidays/:id
 * @desc    Get holiday by ID
 * @access  Private
 */
router.get('/:id', getHolidayById);

/**
 * @route   POST /api/holidays
 * @desc    Create a holiday
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, createHoliday);

/**
 * @route   POST /api/holidays/bulk
 * @desc    Bulk create holidays
 * @access  Private (Admin only)
 */
router.post('/bulk', requireAdmin, bulkCreateHolidays);

/**
 * @route   POST /api/holidays/import
 * @desc    Import holidays from CSV
 * @access  Private (Admin only)
 */
router.post('/import', requireAdmin, upload.single('file'), importHolidaysFromCSV);

/**
 * @route   PUT /api/holidays/:id
 * @desc    Update holiday
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, updateHoliday);

/**
 * @route   DELETE /api/holidays/:id
 * @desc    Delete holiday
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, deleteHoliday);

export default router;
