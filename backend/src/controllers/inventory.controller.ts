import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import InventoryProduct from '../models/InventoryProduct';
import InventoryMovement from '../models/InventoryMovement';
import { User, Vendor, Customer } from '../models';
import logger from '../utils/logger';
import sequelize from '../config/database';

// Helper function to generate barcode as data URL
const generateBarcodeDataURL = (data: string): string => {
  const canvas = createCanvas(300, 100);
  JsBarcode(canvas, data, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 14,
    margin: 10,
  });
  return canvas.toDataURL('image/png');
};

// Helper function to generate SKU
const generateSKU = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SKU-${timestamp}-${random}`;
};

// Get all products with pagination and filters
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, search, category, brand } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    const { count, rows } = await InventoryProduct.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      items: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching inventory products:', error);
    res.status(500).json({ message: 'Failed to fetch inventory products' });
  }
};

// Get products grouped by name with aggregate counts
export const getGroupedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, brand } = req.query;

    const where: any = { isActive: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    // Get all active products
    const products = await InventoryProduct.findAll({
      where,
      order: [['name', 'ASC'], ['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Group products by name
    const grouped: { [key: string]: { name: string; totalQuantity: number; brand?: string; category?: string; items: any[] } } = {};

    products.forEach((product) => {
      const name = product.name;
      if (!grouped[name]) {
        grouped[name] = {
          name,
          totalQuantity: 0,
          brand: product.brand,
          category: product.category,
          items: [],
        };
      }
      grouped[name].totalQuantity += product.quantity;
      grouped[name].items.push(product);
    });

    // Convert to array and sort by total quantity descending
    const result = Object.values(grouped).sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching grouped products:', error);
    res.status(500).json({ message: 'Failed to fetch grouped products' });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await InventoryProduct.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Get product by physical barcode
export const getProductByBarcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;

    const product = await InventoryProduct.findOne({
      where: { barcode, isActive: true },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found', isNew: true, barcode });
      return;
    }

    res.json(product);
  } catch (error) {
    logger.error('Error fetching product by barcode:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Get product by barcode/SKU data (legacy support)
export const getProductByQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrData } = req.params;

    // First try to find by physical barcode
    let product = await InventoryProduct.findOne({ where: { barcode: qrData, isActive: true } });

    // Then try by SKU
    if (!product) {
      product = await InventoryProduct.findOne({ where: { sku: qrData, isActive: true } });
    }

    // If not found, try legacy QR format
    if (!product) {
      const idMatch = qrData.match(/ID:(\d+)/);
      if (idMatch) {
        const productId = parseInt(idMatch[1], 10);
        product = await InventoryProduct.findByPk(productId);
      }
    }

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    logger.error('Error scanning barcode:', error);
    res.status(500).json({ message: 'Failed to scan barcode' });
  }
};

// Get product name suggestions for auto-complete
export const getProductNameSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || (query as string).length < 2) {
      res.json([]);
      return;
    }

    const products = await InventoryProduct.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` },
        isActive: true,
      },
      attributes: ['name', 'brand', 'category', 'unitPrice', 'unit'],
      group: ['name', 'brand', 'category', 'unitPrice', 'unit'],
      limit: 10,
    });

    res.json(products);
  } catch (error) {
    logger.error('Error fetching product suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};

// Quick scan stock-in (increment quantity by 1)
export const scanStockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      res.status(400).json({ message: 'Barcode is required' });
      return;
    }

    // Find product by barcode
    const product = await InventoryProduct.findOne({
      where: { barcode, isActive: true },
    });

    if (!product) {
      // Product not found - return flag for new product creation
      res.json({ isNew: true, barcode });
      return;
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + 1;

    // Update product quantity
    await product.update({ quantity: newQuantity });

    // Create movement record
    await InventoryMovement.create({
      productId: product.id,
      movementType: 'in',
      quantity: 1,
      previousQuantity,
      newQuantity,
      reason: 'Barcode scan stock-in',
      createdBy: req.user?.id,
    });

    logger.info(`Stock in via scan: +1 for product ${product.id} (${product.name})`);

    res.json({
      isNew: false,
      product,
      previousQuantity,
      newQuantity,
      message: `Added 1x ${product.name}. Total: ${newQuantity}`,
    });
  } catch (error) {
    logger.error('Error processing scan stock-in:', error);
    res.status(500).json({ message: 'Failed to process stock-in' });
  }
};

// Quick scan stock-out (decrement quantity by 1)
export const scanStockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      res.status(400).json({ message: 'Barcode is required' });
      return;
    }

    // Find product by barcode
    const product = await InventoryProduct.findOne({
      where: { barcode, isActive: true },
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found in inventory' });
      return;
    }

    if (product.quantity <= 0) {
      res.status(400).json({ message: 'No stock available', product });
      return;
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity - 1;

    // Update product quantity
    await product.update({ quantity: newQuantity });

    // Create movement record
    await InventoryMovement.create({
      productId: product.id,
      movementType: 'out',
      quantity: 1,
      previousQuantity,
      newQuantity,
      reason: 'Barcode scan stock-out',
      createdBy: req.user?.id,
    });

    logger.info(`Stock out via scan: -1 for product ${product.id} (${product.name})`);

    res.json({
      product,
      previousQuantity,
      newQuantity,
      message: `Removed 1x ${product.name}. Remaining: ${newQuantity}`,
    });
  } catch (error) {
    logger.error('Error processing scan stock-out:', error);
    res.status(500).json({ message: 'Failed to process stock-out' });
  }
};

// Parse barcode/QR code data - supports SKU barcodes, existing products and new product templates
export const parseQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrData } = req.params;

    if (!qrData) {
      res.status(400).json({ message: 'Barcode data is required' });
      return;
    }

    // First, try to find product by physical barcode
    let product = await InventoryProduct.findOne({ where: { barcode: qrData, isActive: true } });
    if (product) {
      res.json({
        isNew: false,
        existingProduct: product,
        barcode: product.barcode,
        name: product.name,
      });
      return;
    }

    // Try to find by SKU
    if (!qrData.includes('|') && !qrData.includes(':')) {
      product = await InventoryProduct.findOne({ where: { sku: qrData, isActive: true } });
      if (product) {
        res.json({
          isNew: false,
          existingProduct: product,
          sku: product.sku,
          name: product.name,
        });
        return;
      }
      // Barcode not found, return as new product template
      res.json({
        isNew: true,
        barcode: qrData,
        sku: generateSKU(),
        name: '',
        description: '',
        category: '',
        brand: '',
        unit: 'pcs',
        unitPrice: undefined,
      });
      return;
    }

    // Check if it's a new product template QR
    if (qrData.startsWith('NEW|')) {
      const productData: any = {
        isNew: true,
        barcode: '',
        sku: generateSKU(),
        name: '',
        description: '',
        category: '',
        brand: '',
        unit: 'pcs',
        unitPrice: undefined,
      };

      const parts = qrData.substring(4).split('|');
      parts.forEach(part => {
        const colonIndex = part.indexOf(':');
        if (colonIndex > 0) {
          const key = part.substring(0, colonIndex).toUpperCase();
          const value = part.substring(colonIndex + 1);

          switch (key) {
            case 'SKU':
              productData.sku = value;
              break;
            case 'NAME':
              productData.name = value;
              break;
            case 'CAT':
            case 'CATEGORY':
              productData.category = value;
              break;
            case 'BRAND':
              productData.brand = value;
              break;
            case 'UNIT':
              productData.unit = value;
              break;
            case 'PRICE':
              productData.unitPrice = parseFloat(value) || undefined;
              break;
            case 'DESC':
            case 'DESCRIPTION':
              productData.description = value;
              break;
          }
        }
      });

      res.json(productData);
      return;
    }

    // Try to parse existing product format: ID:{id}|SKU:{sku}|NAME:{name}
    const idMatch = qrData.match(/ID:(\d+)/);
    const skuMatch = qrData.match(/SKU:([^|]+)/);
    const nameMatch = qrData.match(/NAME:([^|]+)/);

    if (idMatch) {
      const productId = parseInt(idMatch[1], 10);
      product = await InventoryProduct.findByPk(productId);

      if (product) {
        res.json({
          isNew: false,
          existingProduct: product,
          sku: product.sku,
          name: product.name,
        });
        return;
      }
    }

    // Product not found by ID, return parsed data for creating new
    res.json({
      isNew: true,
      barcode: qrData,
      sku: skuMatch ? skuMatch[1] : generateSKU(),
      name: nameMatch ? nameMatch[1] : '',
      description: '',
      category: '',
      brand: '',
      unit: 'pcs',
      unitPrice: undefined,
    });
  } catch (error) {
    logger.error('Error parsing QR code:', error);
    res.status(500).json({ message: 'Failed to parse QR code' });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sku,
      name,
      description,
      category,
      brand,
      quantity = 0,
      unit = 'pcs',
      unitPrice,
      barcode,
      isManualEntry = false,
    } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    // Generate SKU if not provided
    const finalSku = sku || generateSKU();

    // Check if SKU already exists
    const existingSku = await InventoryProduct.findOne({ where: { sku: finalSku } });
    if (existingSku) {
      res.status(400).json({ message: 'SKU already exists' });
      return;
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await InventoryProduct.findOne({ where: { barcode } });
      if (existingBarcode) {
        res.status(400).json({ message: 'Barcode already exists in inventory' });
        return;
      }
    }

    // Handle uploaded images
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    const images = uploadedFiles?.map(file => `/uploads/inventory/${file.filename}`) || [];

    // Determine quantity - for barcode scans, it's always 1; for manual entry, use provided quantity
    const isManual = isManualEntry === true || isManualEntry === 'true';
    const finalQuantity = isManual ? (parseInt(quantity, 10) || 0) : 1;

    const product = await InventoryProduct.create({
      sku: finalSku,
      name,
      description,
      category,
      brand,
      quantity: finalQuantity,
      unit,
      unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
      barcode: barcode || undefined,
      barcodeType: barcode ? 'EAN' : 'CODE128',
      isManualEntry: isManual,
      images,
      createdBy: req.user?.id,
    });

    // Generate system barcode using SKU (for display/printing)
    const barcodeDataURL = generateBarcodeDataURL(product.sku);
    await product.update({ qrCode: barcodeDataURL });

    // Create initial stock movement
    if (finalQuantity > 0) {
      await InventoryMovement.create({
        productId: product.id,
        movementType: 'in',
        quantity: finalQuantity,
        previousQuantity: 0,
        newQuantity: finalQuantity,
        reason: isManual ? 'Initial stock (manual entry)' : 'Initial stock (barcode scan)',
        createdBy: req.user?.id,
      });
    }

    logger.info(`Product created: ${product.id} - ${product.name} (manual: ${isManual})`);
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sku, name, description, category, brand, unit, unitPrice, isActive, existingImages, imagesToRemove } = req.body;

    const product = await InventoryProduct.findByPk(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // If SKU is being updated, check for duplicates
    if (sku && sku !== product.sku) {
      const existingSku = await InventoryProduct.findOne({ where: { sku } });
      if (existingSku) {
        res.status(400).json({ message: 'SKU already exists' });
        return;
      }
    }

    // Handle images
    let currentImages = product.images || [];

    // Remove images marked for deletion
    if (imagesToRemove) {
      const toRemove = JSON.parse(imagesToRemove);
      currentImages = currentImages.filter(img => !toRemove.includes(img));
    }

    // Add newly uploaded images
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    const newImages = uploadedFiles?.map(file => `/uploads/inventory/${file.filename}`) || [];
    const updatedImages = [...currentImages, ...newImages];

    await product.update({
      sku: sku ?? product.sku,
      name: name ?? product.name,
      description: description ?? product.description,
      category: category ?? product.category,
      brand: brand ?? product.brand,
      unit: unit ?? product.unit,
      unitPrice: unitPrice ? parseFloat(unitPrice) : product.unitPrice,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : product.isActive,
      images: updatedImages,
    });

    // Regenerate barcode if SKU changed
    if (sku && sku !== product.sku) {
      const barcodeDataURL = generateBarcodeDataURL(product.sku);
      await product.update({ qrCode: barcodeDataURL });
    }

    logger.info(`Product updated: ${product.id}`);
    res.json(product);
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await InventoryProduct.findByPk(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Soft delete - mark as inactive
    await product.update({ isActive: false });

    logger.info(`Product deleted: ${id}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// Record stock movement (in/out/adjustment)
export const recordStockMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      movementType,
      quantity,
      reason,
      referenceNumber,
      // Vendor for stock in
      vendorId,
      // Customer for stock out
      customerId,
      // Sender details (for stock in)
      senderName,
      senderPhone,
      senderCompany,
      senderAddress,
      // Receiver details (for stock out)
      receiverName,
      receiverPhone,
      receiverCompany,
      receiverAddress,
      // Delivery person details
      deliveryPersonName,
      deliveryPersonPhone,
    } = req.body;

    if (!productId || !movementType || !quantity) {
      res.status(400).json({ message: 'Product ID, movement type, and quantity are required' });
      return;
    }

    if (!['in', 'out', 'adjustment'].includes(movementType)) {
      res.status(400).json({ message: 'Invalid movement type' });
      return;
    }

    const product = await InventoryProduct.findByPk(productId);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const previousQuantity = product.quantity;
    const qty = parseInt(quantity, 10);
    let newQuantity: number;

    // Calculate new quantity based on movement type
    if (movementType === 'in') {
      newQuantity = previousQuantity + Math.abs(qty);
    } else if (movementType === 'out') {
      newQuantity = previousQuantity - Math.abs(qty);
      if (newQuantity < 0) {
        res.status(400).json({ message: 'Insufficient stock' });
        return;
      }
    } else {
      // adjustment
      newQuantity = qty;
    }

    // Update product quantity
    await product.update({ quantity: newQuantity });

    // Handle uploaded images
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    const images = uploadedFiles?.map(file => `/uploads/inventory/${file.filename}`) || [];

    // Create movement record
    const movement = await InventoryMovement.create({
      productId: parseInt(productId, 10),
      movementType,
      quantity: Math.abs(qty),
      previousQuantity,
      newQuantity,
      reason,
      referenceNumber,
      images,
      // Vendor for stock in
      vendorId: movementType === 'in' && vendorId ? parseInt(vendorId, 10) : undefined,
      // Customer for stock out
      customerId: movementType === 'out' && customerId ? parseInt(customerId, 10) : undefined,
      // Sender details (for stock in)
      senderName: movementType === 'in' ? senderName : undefined,
      senderPhone: movementType === 'in' ? senderPhone : undefined,
      senderCompany: movementType === 'in' ? senderCompany : undefined,
      senderAddress: movementType === 'in' ? senderAddress : undefined,
      // Receiver details (for stock out)
      receiverName: movementType === 'out' ? receiverName : undefined,
      receiverPhone: movementType === 'out' ? receiverPhone : undefined,
      receiverCompany: movementType === 'out' ? receiverCompany : undefined,
      receiverAddress: movementType === 'out' ? receiverAddress : undefined,
      // Delivery person details (for both in and out)
      deliveryPersonName: ['in', 'out'].includes(movementType) ? deliveryPersonName : undefined,
      deliveryPersonPhone: ['in', 'out'].includes(movementType) ? deliveryPersonPhone : undefined,
      createdBy: req.user?.id,
    });

    logger.info(
      `Stock movement recorded: ${movementType} ${quantity} for product ${productId}`
    );
    res.status(201).json({ movement, product });
  } catch (error) {
    logger.error('Error recording stock movement:', error);
    res.status(500).json({ message: 'Failed to record stock movement' });
  }
};

// Get stock movements with filters
export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, productId, movementType, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const { count, rows } = await InventoryMovement.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: InventoryProduct,
          as: 'product',
          attributes: ['id', 'sku', 'name', 'unit', 'brand'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'name', 'contactPerson', 'phone', 'email'],
          required: false,
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'contactPerson', 'phone', 'email'],
          required: false,
        },
      ],
    });

    res.json({
      items: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Failed to fetch stock movements' });
  }
};

// Get unique categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await InventoryProduct.findAll({
      attributes: ['category'],
      where: {
        category: { [Op.ne]: null as unknown as string },
        isActive: true,
      },
      group: ['category'],
    });

    const categoryList = categories
      .map((p) => p.category)
      .filter((c): c is string => c !== null && c !== undefined);

    res.json(categoryList);
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Create multiple individual products for manual entry (each with quantity = 1)
export const createBulkManualProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      category,
      brand,
      quantity = 1,
      unit = 'pcs',
      unitPrice,
      vendorId,
    } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const count = parseInt(quantity, 10) || 1;
    if (count < 1 || count > 100) {
      res.status(400).json({ message: 'Quantity must be between 1 and 100' });
      return;
    }

    // Handle uploaded images (shared across all products)
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    const images = uploadedFiles?.map(file => `/uploads/inventory/${file.filename}`) || [];

    const createdProducts: any[] = [];

    // Create individual products
    for (let i = 0; i < count; i++) {
      const sku = generateSKU();

      const product = await InventoryProduct.create({
        sku,
        name,
        description,
        category,
        brand,
        quantity: 1, // Each product has quantity 1
        unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        barcode: undefined, // No physical barcode
        barcodeType: 'CODE128',
        isManualEntry: true,
        images,
        createdBy: req.user?.id,
      });

      // Generate system barcode using SKU
      const barcodeDataURL = generateBarcodeDataURL(product.sku);
      await product.update({ qrCode: barcodeDataURL });

      // Create initial stock movement
      await InventoryMovement.create({
        productId: product.id,
        movementType: 'in',
        quantity: 1,
        previousQuantity: 0,
        newQuantity: 1,
        reason: 'Initial stock (manual entry)',
        vendorId: vendorId ? parseInt(vendorId, 10) : undefined,
        createdBy: req.user?.id,
      });

      createdProducts.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        qrCode: barcodeDataURL,
      });
    }

    logger.info(`Bulk manual products created: ${count} items of "${name}"`);
    res.status(201).json({
      message: `Created ${count} individual product(s)`,
      products: createdProducts,
    });
  } catch (error) {
    logger.error('Error creating bulk manual products:', error);
    res.status(500).json({ message: 'Failed to create products' });
  }
};

// Get unique brands
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await InventoryProduct.findAll({
      attributes: ['brand'],
      where: {
        brand: { [Op.ne]: null as unknown as string },
        isActive: true,
      },
      group: ['brand'],
    });

    const brandList = brands
      .map((p) => p.brand)
      .filter((b): b is string => b !== null && b !== undefined);

    res.json(brandList);
  } catch (error) {
    logger.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
};
