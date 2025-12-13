import { Router } from 'express';
import {
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { loginValidation, changePasswordValidation } from '../utils/validators';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, validateRequest, login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validateRequest,
  changePassword
);

export default router;
