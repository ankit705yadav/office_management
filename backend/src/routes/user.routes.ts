import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserTeam,
  getAllDepartments,
  generateIdCard,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireManagerOrAdmin, canManageUser } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/departments
 * @desc    Get all departments
 * @access  Private (All authenticated users)
 */
router.get('/departments', getAllDepartments);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Manager/Admin)
 */
router.get('/', requireManagerOrAdmin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Self or Manager/Admin)
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user with profile image URL and document links
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Self or Admin)
 */
router.put('/:id', canManageUser, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, deleteUser);

/**
 * @route   GET /api/users/:id/team
 * @desc    Get user's team (subordinates)
 * @access  Private (Self or Manager/Admin)
 */
router.get('/:id/team', getUserTeam);

/**
 * @route   GET /api/users/:id/id-card
 * @desc    Generate employee ID card as PDF
 * @access  Private (Admin only)
 */
router.get('/:id/id-card', requireAdmin, generateIdCard);

export default router;
