import { Request, Response } from 'express';
import { ExpenseCategoryCap } from '../models';
import { ExpenseCategory } from '../types/enums';
import logger from '../utils/logger';

/**
 * Get all expense category caps
 * GET /api/expense-caps
 */
export const getAllCaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const caps = await ExpenseCategoryCap.findAll({
      order: [['category', 'ASC']],
    });

    // Return all categories with their caps (or null if not set)
    const allCategories = Object.values(ExpenseCategory);
    const capsMap = new Map(caps.map(cap => [cap.category, cap]));

    const result = allCategories.map(category => ({
      category,
      capAmount: capsMap.get(category)?.capAmount || null,
      isActive: capsMap.get(category)?.isActive ?? false,
      id: capsMap.get(category)?.id || null,
    }));

    res.status(200).json({
      status: 'success',
      data: { caps: result },
    });
  } catch (error) {
    logger.error('Get all expense caps error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching expense caps',
    });
  }
};

/**
 * Get cap for a specific category
 * GET /api/expense-caps/:category
 */
export const getCapByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;

    if (!Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid expense category',
      });
      return;
    }

    const cap = await ExpenseCategoryCap.findOne({
      where: { category },
    });

    res.status(200).json({
      status: 'success',
      data: {
        category,
        capAmount: cap?.capAmount || null,
        isActive: cap?.isActive ?? false,
      },
    });
  } catch (error) {
    logger.error('Get expense cap by category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching expense cap',
    });
  }
};

/**
 * Set or update cap for a category (Admin only)
 * PUT /api/expense-caps/:category
 */
export const setCapForCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { capAmount, isActive } = req.body;

    if (!Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid expense category',
      });
      return;
    }

    if (capAmount === undefined || capAmount === null || capAmount < 0) {
      res.status(400).json({
        status: 'error',
        message: 'Cap amount must be a non-negative number',
      });
      return;
    }

    // Upsert the cap
    const [cap, created] = await ExpenseCategoryCap.upsert({
      category: category as ExpenseCategory,
      capAmount,
      isActive: isActive !== undefined ? isActive : true,
    });

    logger.info(`Expense cap ${created ? 'created' : 'updated'} for ${category}: ${capAmount} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: `Expense cap ${created ? 'created' : 'updated'} successfully`,
      data: { cap },
    });
  } catch (error) {
    logger.error('Set expense cap error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while setting expense cap',
    });
  }
};

/**
 * Remove cap for a category (Admin only)
 * DELETE /api/expense-caps/:category
 */
export const removeCapForCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;

    if (!Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid expense category',
      });
      return;
    }

    const deleted = await ExpenseCategoryCap.destroy({
      where: { category },
    });

    if (deleted === 0) {
      res.status(404).json({
        status: 'error',
        message: 'No cap found for this category',
      });
      return;
    }

    logger.info(`Expense cap removed for ${category} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Expense cap removed successfully',
    });
  } catch (error) {
    logger.error('Remove expense cap error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while removing expense cap',
    });
  }
};
