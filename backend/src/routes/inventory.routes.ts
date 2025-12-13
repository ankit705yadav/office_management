import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllProducts,
  getGroupedProducts,
  getProductById,
  getProductByBarcode,
  getProductByQR,
  parseQRCode,
  getProductNameSuggestions,
  scanStockIn,
  scanStockOut,
  createProduct,
  createBulkManualProducts,
  updateProduct,
  deleteProduct,
  recordStockMovement,
  getStockMovements,
  getCategories,
  getBrands,
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin } from '../middleware/roleCheck';

const router = Router();

// Configure multer for inventory image uploads
const inventoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/inventory/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `inventory-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const imageFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

const inventoryUpload = multer({
  storage: inventoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFileFilter
});

// All routes require authentication and manager/admin role
router.use(authenticate);
router.use(requireManagerOrAdmin);

// Product routes
router.get('/products', getAllProducts);
router.get('/products/grouped', getGroupedProducts);
router.get('/products/suggestions', getProductNameSuggestions);
router.get('/products/by-barcode/:barcode', getProductByBarcode);
router.get('/products/scan/:qrData', getProductByQR);
router.get('/products/parse-qr/:qrData', parseQRCode);
router.get('/products/:id', getProductById);
router.post('/products', inventoryUpload.array('images', 5), createProduct);
router.post('/products/bulk-manual', inventoryUpload.array('images', 5), createBulkManualProducts);
router.put('/products/:id', inventoryUpload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

// Quick scan stock operations
router.post('/scan-stock-in', scanStockIn);
router.post('/scan-stock-out', scanStockOut);

// Stock movement routes
router.post('/movements', inventoryUpload.array('images', 5), recordStockMovement);
router.get('/movements', getStockMovements);

// Category and brand routes
router.get('/categories', getCategories);
router.get('/brands', getBrands);

export default router;
