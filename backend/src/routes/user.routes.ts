import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
import { validateRequest } from '../middleware/validateRequest';
import { createUserValidation } from '../utils/validators';

const router = Router();

// Ensure uploads directories exist
const profilesDir = path.join(__dirname, '../../uploads/profiles');
const documentsDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, profilesDir);
    } else if (file.fieldname === 'documents') {
      cb(null, documentsDir);
    } else {
      cb(null, profilesDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'documents' ? 'doc' : 'profile';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for profile'));
      }
    } else if (file.fieldname === 'documents') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files and PDFs are allowed for documents'));
      }
    } else {
      cb(null, true);
    }
  },
});

// Multiple file upload fields configuration
const employeeUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);

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
 * @desc    Create new user with optional profile image and documents
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, employeeUpload, createUser);

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
