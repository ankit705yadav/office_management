import { Router } from 'express';
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorCategories,
  toggleVendorStatus,
} from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin, requireAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all vendors
router.get('/', getAllVendors);

// Get vendor categories
router.get('/categories', getVendorCategories);

// Get vendor by ID
router.get('/:id', getVendorById);

// Create vendor (Admin/Manager only)
router.post('/', requireManagerOrAdmin, createVendor);

// Update vendor (Admin/Manager only)
router.put('/:id', requireManagerOrAdmin, updateVendor);

// Toggle vendor status (Admin/Manager only)
router.patch('/:id/toggle-status', requireManagerOrAdmin, toggleVendorStatus);

// Delete vendor (Admin only)
router.delete('/:id', requireAdmin, deleteVendor);

export default router;
