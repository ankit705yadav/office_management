import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Vendor from '../models/Vendor';
import logger from '../utils/logger';

// Get all vendors with pagination and search
export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, isActive } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { gstNumber: { [Op.iLike]: `%${search}%` } },
        { contactPerson: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows } = await Vendor.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
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
    logger.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
};

// Get vendor by ID
export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    res.json(vendor);
  } catch (error) {
    logger.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Failed to fetch vendor' });
  }
};

// Create vendor
export const createVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIfscCode,
      contactPerson,
      contactPersonPhone,
      category,
      notes,
    } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Vendor name is required' });
      return;
    }

    const vendor = await Vendor.create({
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIfscCode,
      contactPerson,
      contactPersonPhone,
      category,
      notes,
      isActive: true,
    });

    logger.info(`Vendor created: ${vendor.id} - ${vendor.name}`);
    res.status(201).json(vendor);
  } catch (error) {
    logger.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Failed to create vendor' });
  }
};

// Update vendor
export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIfscCode,
      contactPerson,
      contactPersonPhone,
      category,
      notes,
      isActive,
    } = req.body;

    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    await vendor.update({
      name: name ?? vendor.name,
      email: email ?? vendor.email,
      phone: phone ?? vendor.phone,
      address: address ?? vendor.address,
      city: city ?? vendor.city,
      state: state ?? vendor.state,
      pincode: pincode ?? vendor.pincode,
      gstNumber: gstNumber ?? vendor.gstNumber,
      panNumber: panNumber ?? vendor.panNumber,
      bankAccountNumber: bankAccountNumber ?? vendor.bankAccountNumber,
      bankName: bankName ?? vendor.bankName,
      bankIfscCode: bankIfscCode ?? vendor.bankIfscCode,
      contactPerson: contactPerson ?? vendor.contactPerson,
      contactPersonPhone: contactPersonPhone ?? vendor.contactPersonPhone,
      category: category ?? vendor.category,
      notes: notes ?? vendor.notes,
      isActive: isActive ?? vendor.isActive,
    });

    logger.info(`Vendor updated: ${vendor.id}`);
    res.json(vendor);
  } catch (error) {
    logger.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Failed to update vendor' });
  }
};

// Delete vendor
export const deleteVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    await vendor.destroy();

    logger.info(`Vendor deleted: ${id}`);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
};

// Get vendor categories
export const getVendorCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Vendor.findAll({
      attributes: ['category'],
      where: {
        category: { [Op.ne]: null as unknown as string },
      },
      group: ['category'],
    });

    const categoryList = categories
      .map((v) => v.category)
      .filter((c): c is string => c !== null && c !== undefined);

    res.json(categoryList);
  } catch (error) {
    logger.error('Error fetching vendor categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Toggle vendor active status
export const toggleVendorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    await vendor.update({ isActive: !vendor.isActive });

    logger.info(`Vendor status toggled: ${id} - now ${vendor.isActive ? 'active' : 'inactive'}`);
    res.json(vendor);
  } catch (error) {
    logger.error('Error toggling vendor status:', error);
    res.status(500).json({ message: 'Failed to toggle vendor status' });
  }
};
