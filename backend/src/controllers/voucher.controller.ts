import { Request, Response } from 'express';
import { Op } from 'sequelize';
import QRCode from 'qrcode';
import { Voucher, User, Expense } from '../models';
import logger from '../utils/logger';
import { format } from 'date-fns';

/**
 * Generate unique voucher number
 */
const generateVoucherNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VCH-${timestamp}-${random}`;
};

/**
 * Generate QR code data URL from voucher details
 */
const generateQRCode = async (data: object): Promise<string> => {
  const jsonString = JSON.stringify(data);
  return await QRCode.toDataURL(jsonString, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
  });
};

/**
 * Create a new voucher
 * POST /api/vouchers
 */
export const createVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, amount, region, description, expenseId } = req.body;
    const createdBy = req.user!.id;

    // Validate required fields
    if (!name || !amount || !region) {
      res.status(400).json({
        status: 'error',
        message: 'Name, amount, and region are required',
      });
      return;
    }

    // Validate amount is positive
    if (Number(amount) <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be a positive number',
      });
      return;
    }

    // Generate voucher number
    const voucherNumber = generateVoucherNumber();

    // Create QR code data
    const qrData = {
      voucherNumber,
      name,
      amount: Number(amount),
      region,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user!.email,
    };

    // Generate QR code as data URL
    const qrCodeData = await generateQRCode(qrData);

    // Create voucher
    const voucher = await Voucher.create({
      voucherNumber,
      name,
      amount: Number(amount),
      region,
      qrCodeData,
      description,
      createdBy,
      expenseId: expenseId || null,
    });

    // Fetch with associations
    const voucherWithDetails = await Voucher.findByPk(voucher.id, {
      include: [
        { association: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'expense' },
      ],
    });

    logger.info(`Voucher created: ${voucherNumber} by user ${createdBy}`);

    res.status(201).json({
      status: 'success',
      message: 'Voucher generated successfully',
      data: { voucher: voucherWithDetails },
    });
  } catch (error) {
    logger.error('Create voucher error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating voucher',
    });
  }
};

/**
 * Get all vouchers (with filters)
 * GET /api/vouchers
 */
export const getAllVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { region, isUsed, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Role-based filtering - employees see only their own vouchers
    if (req.user?.role === 'employee') {
      where.createdBy = req.user.id;
    }

    // Apply filters
    if (region) where.region = region;
    if (isUsed !== undefined) where.isUsed = isUsed === 'true';
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: vouchers } = await Voucher.findAndCountAll({
      where,
      include: [
        { association: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'expense', attributes: ['id', 'amount', 'category', 'description'] },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        vouchers,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all vouchers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching vouchers',
    });
  }
};

/**
 * Get voucher by ID
 * GET /api/vouchers/:id
 */
export const getVoucherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await Voucher.findByPk(id, {
      include: [
        { association: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'expense' },
      ],
    });

    if (!voucher) {
      res.status(404).json({
        status: 'error',
        message: 'Voucher not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { voucher },
    });
  } catch (error) {
    logger.error('Get voucher by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching voucher',
    });
  }
};

/**
 * Get voucher by voucher number (for QR code scanning)
 * GET /api/vouchers/verify/:voucherNumber
 */
export const getVoucherByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voucherNumber } = req.params;

    const voucher = await Voucher.findOne({
      where: { voucherNumber },
      include: [
        { association: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'expense' },
      ],
    });

    if (!voucher) {
      res.status(404).json({
        status: 'error',
        message: 'Voucher not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { voucher },
    });
  } catch (error) {
    logger.error('Get voucher by number error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching voucher',
    });
  }
};

/**
 * Mark voucher as used
 * PUT /api/vouchers/:id/use
 */
export const markVoucherAsUsed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await Voucher.findByPk(id);

    if (!voucher) {
      res.status(404).json({
        status: 'error',
        message: 'Voucher not found',
      });
      return;
    }

    if (voucher.isUsed) {
      res.status(400).json({
        status: 'error',
        message: 'Voucher has already been used',
      });
      return;
    }

    await voucher.update({
      isUsed: true,
      usedAt: new Date(),
    });

    logger.info(`Voucher marked as used: ${voucher.voucherNumber}`);

    res.status(200).json({
      status: 'success',
      message: 'Voucher marked as used',
      data: { voucher },
    });
  } catch (error) {
    logger.error('Mark voucher as used error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating voucher',
    });
  }
};

/**
 * Delete voucher
 * DELETE /api/vouchers/:id
 */
export const deleteVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const voucher = await Voucher.findByPk(id);

    if (!voucher) {
      res.status(404).json({
        status: 'error',
        message: 'Voucher not found',
      });
      return;
    }

    // Only creator or admin can delete
    if (voucher.createdBy !== userId && userRole !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'You can only delete vouchers you created',
      });
      return;
    }

    if (voucher.isUsed) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot delete a voucher that has been used',
      });
      return;
    }

    await voucher.destroy();

    logger.info(`Voucher deleted: ${voucher.voucherNumber} by user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Voucher deleted successfully',
    });
  } catch (error) {
    logger.error('Delete voucher error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting voucher',
    });
  }
};

/**
 * Get distinct regions for dropdown
 * GET /api/vouchers/regions
 */
export const getRegions = async (req: Request, res: Response): Promise<void> => {
  try {
    const vouchers = await Voucher.findAll({
      attributes: ['region'],
      group: ['region'],
      order: [['region', 'ASC']],
    });

    const regions = vouchers.map((v) => v.region);

    // Add default regions if no vouchers exist
    const defaultRegions = ['North', 'South', 'East', 'West', 'Central'];
    const allRegions = [...new Set([...defaultRegions, ...regions])].sort();

    res.status(200).json({
      status: 'success',
      data: { regions: allRegions },
    });
  } catch (error) {
    logger.error('Get regions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching regions',
    });
  }
};
