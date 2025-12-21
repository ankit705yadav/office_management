import { Router } from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireManagerOrAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/clients
 * @desc    Get all clients
 * @access  Private (All authenticated users)
 */
router.get('/', getAllClients);

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Private
 */
router.get('/:id', getClientById);

/**
 * @route   POST /api/clients
 * @desc    Create a client
 * @access  Private (Manager/Admin)
 */
router.post('/', requireManagerOrAdmin, createClient);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private (Manager/Admin)
 */
router.put('/:id', requireManagerOrAdmin, updateClient);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, deleteClient);

export default router;
