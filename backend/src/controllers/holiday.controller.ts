import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Holiday } from '../models';
import logger from '../utils/logger';

/**
 * Get all holidays for a year
 * GET /api/holidays
 */
export const getAllHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear(), isOptional } = req.query;

    const where: any = { year: Number(year) };

    if (isOptional !== undefined) {
      where.isOptional = isOptional === 'true';
    }

    const holidays = await Holiday.findAll({
      where,
      order: [['date', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: { holidays, count: holidays.length },
    });
  } catch (error) {
    logger.error('Get all holidays error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching holidays',
    });
  }
};

/**
 * Get upcoming holidays
 * GET /api/holidays/upcoming
 */
export const getUpcomingHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 5 } = req.query;
    const today = new Date();

    const holidays = await Holiday.findAll({
      where: {
        date: {
          [Op.gte]: today,
        },
      },
      order: [['date', 'ASC']],
      limit: Number(limit),
    });

    res.status(200).json({
      status: 'success',
      data: { holidays },
    });
  } catch (error) {
    logger.error('Get upcoming holidays error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching upcoming holidays',
    });
  }
};

/**
 * Get holiday by ID
 * GET /api/holidays/:id
 */
export const getHolidayById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
      res.status(404).json({
        status: 'error',
        message: 'Holiday not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { holiday },
    });
  } catch (error) {
    logger.error('Get holiday by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching holiday',
    });
  }
};

/**
 * Create holiday (Admin only)
 * POST /api/holidays
 */
export const createHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, name, description, isOptional, year } = req.body;

    const holiday = await Holiday.create({
      date,
      name,
      description,
      isOptional: isOptional || false,
      year: year || new Date(date).getFullYear(),
    });

    logger.info(`Holiday created: ${holiday.name} by ${req.user?.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Holiday created successfully',
      data: { holiday },
    });
  } catch (error) {
    logger.error('Create holiday error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating holiday',
    });
  }
};

/**
 * Bulk create holidays (Admin only)
 * POST /api/holidays/bulk
 */
export const bulkCreateHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { holidays } = req.body;

    if (!Array.isArray(holidays) || holidays.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Holidays array is required',
      });
      return;
    }

    // Add year to each holiday if not provided
    const holidaysWithYear = holidays.map((h) => ({
      ...h,
      year: h.year || new Date(h.date).getFullYear(),
      isOptional: h.isOptional || false,
    }));

    const createdHolidays = await Holiday.bulkCreate(holidaysWithYear);

    logger.info(`${createdHolidays.length} holidays created by ${req.user?.email}`);

    res.status(201).json({
      status: 'success',
      message: `${createdHolidays.length} holidays created successfully`,
      data: { holidays: createdHolidays },
    });
  } catch (error) {
    logger.error('Bulk create holidays error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating holidays',
    });
  }
};

/**
 * Update holiday (Admin only)
 * PUT /api/holidays/:id
 */
export const updateHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, name, description, isOptional, year } = req.body;

    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
      res.status(404).json({
        status: 'error',
        message: 'Holiday not found',
      });
      return;
    }

    await holiday.update({
      date: date || holiday.date,
      name: name || holiday.name,
      description: description !== undefined ? description : holiday.description,
      isOptional: isOptional !== undefined ? isOptional : holiday.isOptional,
      year: year || holiday.year,
    });

    logger.info(`Holiday updated: ${holiday.name} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Holiday updated successfully',
      data: { holiday },
    });
  } catch (error) {
    logger.error('Update holiday error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating holiday',
    });
  }
};

/**
 * Delete holiday (Admin only)
 * DELETE /api/holidays/:id
 */
export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
      res.status(404).json({
        status: 'error',
        message: 'Holiday not found',
      });
      return;
    }

    await holiday.destroy();

    logger.info(`Holiday deleted: ${holiday.name} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    logger.error('Delete holiday error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting holiday',
    });
  }
};

