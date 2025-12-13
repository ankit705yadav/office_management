import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin } from '../middleware/roleCheck';
import {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getCategories,
  lendAsset,
  returnAsset,
  getAllAssignments,
  getMyAssets,
  getOverdueAssets,
  markAsLostOrDamaged,
  getAssignmentStats,
  searchEmployees,
  // Asset request endpoints
  createAssetRequest,
  getAllAssetRequests,
  getMyAssetRequests,
  approveAssetRequest,
  rejectAssetRequest,
  cancelAssetRequest,
  getPendingRequestCount,
} from '../controllers/asset.controller';

const router = Router();

// Ensure uploads directory exists
const uploadDir = 'uploads/assets';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for asset image uploads
const assetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `asset-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const assetUpload = multer({
  storage: assetStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// ============================================
// Routes accessible by all authenticated users
// ============================================

// Get current user's assigned assets
router.get('/my', getMyAssets);

// Get current user's asset requests
router.get('/requests/my', getMyAssetRequests);

// Create asset request (any authenticated user)
router.post('/requests', createAssetRequest);

// Cancel own asset request
router.patch('/requests/:id/cancel', cancelAssetRequest);

// Return an asset
router.patch('/assignments/:id/return', returnAsset);

// Get all available assets for requesting (any authenticated user)
router.get('/available', getAllAssets);

// Get asset by ID (all users can view)
router.get('/:id', getAssetById);

// ============================================
// Routes requiring manager or admin role
// ============================================

// Get all assets
router.get('/', requireManagerOrAdmin, getAllAssets);

// Get unique categories for autocomplete
router.get('/meta/categories', requireManagerOrAdmin, getCategories);

// Get assignment statistics
router.get('/meta/stats', requireManagerOrAdmin, getAssignmentStats);

// Search employees for autocomplete
router.get('/meta/employees', requireManagerOrAdmin, searchEmployees);

// Get all assignments
router.get('/assignments/all', requireManagerOrAdmin, getAllAssignments);

// Get overdue assignments
router.get('/assignments/overdue', requireManagerOrAdmin, getOverdueAssets);

// Create new asset
router.post('/', requireManagerOrAdmin, assetUpload.array('images', 5), createAsset);

// Update asset
router.put('/:id', requireManagerOrAdmin, assetUpload.array('images', 5), updateAsset);

// Delete (retire) asset
router.delete('/:id', requireManagerOrAdmin, deleteAsset);

// Lend asset to user
router.post('/:id/lend', requireManagerOrAdmin, lendAsset);

// Mark assignment as lost or damaged
router.patch('/assignments/:id/lost-damaged', requireManagerOrAdmin, markAsLostOrDamaged);

// ============================================
// Asset Request Routes (manager/admin)
// ============================================

// Get all asset requests
router.get('/requests/all', requireManagerOrAdmin, getAllAssetRequests);

// Get pending request count
router.get('/requests/pending-count', requireManagerOrAdmin, getPendingRequestCount);

// Approve asset request
router.patch('/requests/:id/approve', requireManagerOrAdmin, approveAssetRequest);

// Reject asset request
router.patch('/requests/:id/reject', requireManagerOrAdmin, rejectAssetRequest);

export default router;
