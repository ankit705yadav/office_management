import { Router } from 'express';
import {
  getAllHolidays,
  getUpcomingHolidays,
  getHolidayById,
  createHoliday,
  bulkCreateHolidays,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holiday.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

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
