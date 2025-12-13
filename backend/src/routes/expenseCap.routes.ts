import { Router } from 'express';
import {
  getAllCaps,
  getCapByCategory,
  setCapForCategory,
  removeCapForCategory,
} from '../controllers/expenseCap.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/expense-caps
 * @desc    Get all expense category caps
 * @access  Private (All authenticated users)
 */
router.get('/', getAllCaps);

/**
 * @route   GET /api/expense-caps/:category
 * @desc    Get cap for a specific category
 * @access  Private (All authenticated users)
 */
router.get('/:category', getCapByCategory);

/**
 * @route   PUT /api/expense-caps/:category
 * @desc    Set or update cap for a category
 * @access  Private (Admin only)
 */
router.put('/:category', requireAdmin, setCapForCategory);

/**
 * @route   DELETE /api/expense-caps/:category
 * @desc    Remove cap for a category
 * @access  Private (Admin only)
 */
router.delete('/:category', requireAdmin, removeCapForCategory);

export default router;
