import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, EmployeeSalary, Payment } from '../models';
import { PaymentStatus, UserStatus } from '../types/enums';
import logger from '../utils/logger';
import { createNotification } from '../services/notification.service';

// ==================== SALARY MANAGEMENT (ADMIN) ====================

/**
 * Set or update employee salary
 * POST /api/payments/salaries
 */
export const setSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, basicSalary, effectiveFrom } = req.body;
    const adminId = req.user!.id;

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    // Close any existing open salary record
    await EmployeeSalary.update(
      { effectiveTo: new Date(effectiveFrom) },
      {
        where: {
          userId,
          effectiveTo: { [Op.is]: null } as any,
        },
      }
    );

    // Create new salary record
    const salary = await EmployeeSalary.create({
      userId,
      basicSalary,
      effectiveFrom: new Date(effectiveFrom),
      createdBy: adminId,
    });

    logger.info(`Salary set for user ${userId} by admin ${adminId}`);

    res.status(201).json({
      status: 'success',
      message: 'Salary set successfully',
      data: { salary },
    });
  } catch (error) {
    logger.error('Set salary error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to set salary' });
  }
};

/**
 * Get all employee salaries
 * GET /api/payments/salaries
 */
export const getAllSalaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: salaries } = await EmployeeSalary.findAndCountAll({
      where: { effectiveTo: { [Op.is]: null } as any }, // Only current salaries
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'departmentId'],
          include: [{ association: 'department', attributes: ['id', 'name'] }],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        salaries,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all salaries error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch salaries' });
  }
};

/**
 * Get salary for a specific employee
 * GET /api/payments/salaries/:userId
 */
export const getEmployeeSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const salary = await EmployeeSalary.findOne({
      where: { userId, effectiveTo: { [Op.is]: null } as any },
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!salary) {
      res.status(404).json({ status: 'error', message: 'Salary not found for this employee' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { salary },
    });
  } catch (error) {
    logger.error('Get employee salary error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch salary' });
  }
};

// ==================== PAYMENT MANAGEMENT (ADMIN) ====================

/**
 * Run bulk monthly payroll
 * POST /api/payments/run-payroll
 */
export const runBulkPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.body;
    const adminId = req.user!.id;

    // Get all active employees with current salaries
    const salaries = await EmployeeSalary.findAll({
      where: { effectiveTo: { [Op.is]: null } as any },
      include: [
        {
          association: 'user',
          where: { status: UserStatus.ACTIVE },
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    const paymentsCreated: Payment[] = [];
    const errors: string[] = [];

    for (const salary of salaries) {
      try {
        // Check if payment already exists for this month
        const existingPayment = await Payment.findOne({
          where: {
            userId: salary.userId,
            paymentMonth: month,
            paymentYear: year,
          },
        });

        if (existingPayment) {
          errors.push(`Payment already exists for user ${salary.userId} for ${month}/${year}`);
          continue;
        }

        const payment = await Payment.create({
          userId: salary.userId,
          salaryId: salary.id,
          paymentMonth: month,
          paymentYear: year,
          amount: salary.basicSalary,
          status: PaymentStatus.PENDING,
        });

        paymentsCreated.push(payment);

        // Send notification to employee
        await createNotification({
          userId: salary.userId,
          type: 'payment',
          title: 'Payment Generated',
          message: `Your salary payment for ${month}/${year} has been generated`,
          actionUrl: '/payments',
          relatedId: payment.id,
          relatedType: 'payment',
        });
      } catch (err) {
        errors.push(`Failed to create payment for user ${salary.userId}`);
      }
    }

    logger.info(`Bulk payroll run for ${month}/${year} by admin ${adminId}: ${paymentsCreated.length} created`);

    res.status(200).json({
      status: 'success',
      message: `Payroll generated for ${paymentsCreated.length} employees`,
      data: {
        paymentsCreated: paymentsCreated.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error('Run bulk payroll error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to run payroll' });
  }
};

/**
 * Get all payments (Admin)
 * GET /api/payments
 */
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, month, year, status, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (month) where.paymentMonth = Number(month);
    if (year) where.paymentYear = Number(year);
    if (status) where.status = status;
    if (userId) where.userId = Number(userId);

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'payer', attributes: ['id', 'firstName', 'lastName'] },
      ],
      limit: Number(limit),
      offset,
      order: [['payment_year', 'DESC'], ['payment_month', 'DESC'], ['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all payments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payments' });
  }
};

/**
 * Update payment status (mark as paid/pending)
 * PUT /api/payments/:id
 */
export const updatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user!.id;

    const payment = await Payment.findByPk(id, {
      include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });

    if (!payment) {
      res.status(404).json({ status: 'error', message: 'Payment not found' });
      return;
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;

    if (status === PaymentStatus.PAID) {
      updateData.paidAt = new Date();
      updateData.paidBy = adminId;
    }

    await payment.update(updateData);

    // Notify employee
    if (status === PaymentStatus.PAID) {
      await createNotification({
        userId: payment.userId,
        type: 'payment',
        title: 'Payment Processed',
        message: `Your salary payment of ${payment.amount} for ${payment.paymentMonth}/${payment.paymentYear} has been processed`,
        actionUrl: '/payments',
        relatedId: payment.id,
        relatedType: 'payment',
      });
    }

    logger.info(`Payment ${id} updated to ${status} by admin ${adminId}`);

    res.status(200).json({
      status: 'success',
      message: 'Payment updated successfully',
      data: { payment },
    });
  } catch (error) {
    logger.error('Update payment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update payment' });
  }
};

/**
 * Bulk update payments (mark multiple as paid)
 * PUT /api/payments/bulk-update
 */
export const bulkUpdatePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIds, status } = req.body;
    const adminId = req.user!.id;

    const updateData: any = { status };
    if (status === PaymentStatus.PAID) {
      updateData.paidAt = new Date();
      updateData.paidBy = adminId;
    }

    await Payment.update(updateData, {
      where: { id: { [Op.in]: paymentIds } },
    });

    // Notify employees
    const payments = await Payment.findAll({
      where: { id: { [Op.in]: paymentIds } },
    });

    for (const payment of payments) {
      if (status === PaymentStatus.PAID) {
        await createNotification({
          userId: payment.userId,
          type: 'payment',
          title: 'Payment Processed',
          message: `Your salary payment for ${payment.paymentMonth}/${payment.paymentYear} has been processed`,
          actionUrl: '/payments',
          relatedId: payment.id,
          relatedType: 'payment',
        });
      }
    }

    logger.info(`Bulk payment update: ${paymentIds.length} payments marked as ${status} by admin ${adminId}`);

    res.status(200).json({
      status: 'success',
      message: `${paymentIds.length} payments updated successfully`,
    });
  } catch (error) {
    logger.error('Bulk update payments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update payments' });
  }
};

// ==================== EMPLOYEE VIEW ====================

/**
 * Get own salary (Employee)
 * GET /api/payments/my-salary
 */
export const getMySalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const salary = await EmployeeSalary.findOne({
      where: { userId, effectiveTo: { [Op.is]: null } as any },
    });

    res.status(200).json({
      status: 'success',
      data: { salary: salary || null },
    });
  } catch (error) {
    logger.error('Get my salary error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch salary' });
  }
};

/**
 * Get own payment history (Employee)
 * GET /api/payments/my-payments
 */
export const getMyPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 12, year } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (year) where.paymentYear = Number(year);

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      order: [['paymentYear', 'DESC'], ['paymentMonth', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get my payments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payments' });
  }
};

/**
 * Get employees without salary setup (for dropdown)
 * GET /api/payments/employees-without-salary
 */
export const getEmployeesWithoutSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all user IDs that have current salary
    const salaries = await EmployeeSalary.findAll({
      where: { effectiveTo: { [Op.is]: null } as any },
      attributes: ['userId'],
    });
    const usersWithSalary = salaries.map(s => s.userId);

    // Get active users without salary
    const users = await User.findAll({
      where: {
        status: UserStatus.ACTIVE,
        id: { [Op.notIn]: usersWithSalary.length > 0 ? usersWithSalary : [0] },
      },
      attributes: ['id', 'firstName', 'lastName', 'email'],
      order: [['firstName', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    logger.error('Get employees without salary error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch employees' });
  }
};
