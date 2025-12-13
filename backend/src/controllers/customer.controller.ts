import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Customer from '../models/Customer';
import logger from '../utils/logger';

// Get all customers with pagination and search
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, isActive } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
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

    const { count, rows } = await Customer.findAndCountAll({
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
    logger.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
};

// Get customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Failed to fetch customer' });
  }
};

// Create customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      companyName,
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
      res.status(400).json({ message: 'Customer name is required' });
      return;
    }

    const customer = await Customer.create({
      name,
      companyName,
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

    logger.info(`Customer created: ${customer.id} - ${customer.name}`);
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Error creating customer:', error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      companyName,
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

    const customer = await Customer.findByPk(id);

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    await customer.update({
      name: name ?? customer.name,
      companyName: companyName ?? customer.companyName,
      email: email ?? customer.email,
      phone: phone ?? customer.phone,
      address: address ?? customer.address,
      city: city ?? customer.city,
      state: state ?? customer.state,
      pincode: pincode ?? customer.pincode,
      gstNumber: gstNumber ?? customer.gstNumber,
      panNumber: panNumber ?? customer.panNumber,
      bankAccountNumber: bankAccountNumber ?? customer.bankAccountNumber,
      bankName: bankName ?? customer.bankName,
      bankIfscCode: bankIfscCode ?? customer.bankIfscCode,
      contactPerson: contactPerson ?? customer.contactPerson,
      contactPersonPhone: contactPersonPhone ?? customer.contactPersonPhone,
      category: category ?? customer.category,
      notes: notes ?? customer.notes,
      isActive: isActive ?? customer.isActive,
    });

    logger.info(`Customer updated: ${customer.id}`);
    res.json(customer);
  } catch (error) {
    logger.error('Error updating customer:', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    await customer.destroy();

    logger.info(`Customer deleted: ${id}`);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
};

// Get customer categories
export const getCustomerCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Customer.findAll({
      attributes: ['category'],
      where: {
        category: { [Op.ne]: null as unknown as string },
      },
      group: ['category'],
    });

    const categoryList = categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null && c !== undefined);

    res.json(categoryList);
  } catch (error) {
    logger.error('Error fetching customer categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Toggle customer active status
export const toggleCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    await customer.update({ isActive: !customer.isActive });

    logger.info(`Customer status toggled: ${id} - now ${customer.isActive ? 'active' : 'inactive'}`);
    res.json(customer);
  } catch (error) {
    logger.error('Error toggling customer status:', error);
    res.status(500).json({ message: 'Failed to toggle customer status' });
  }
};
