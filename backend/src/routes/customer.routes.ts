import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerCategories,
  toggleCustomerStatus,
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin, requireAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all customers
router.get('/', getAllCustomers);

// Get customer categories
router.get('/categories', getCustomerCategories);

// Get customer by ID
router.get('/:id', getCustomerById);

// Create customer (Admin/Manager only)
router.post('/', requireManagerOrAdmin, createCustomer);

// Update customer (Admin/Manager only)
router.put('/:id', requireManagerOrAdmin, updateCustomer);

// Toggle customer status (Admin/Manager only)
router.patch('/:id/toggle-status', requireManagerOrAdmin, toggleCustomerStatus);

// Delete customer (Admin only)
router.delete('/:id', requireAdmin, deleteCustomer);

export default router;
