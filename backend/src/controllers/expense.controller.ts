import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Expense, User, Notification, ExpenseCategoryCap } from '../models';
import { ExpenseCategory, RequestStatus, UserRole } from '../types/enums';
import logger from '../utils/logger';
import { format } from 'date-fns';

/**
 * Submit expense claim
 * POST /api/expenses
 */
export const submitExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, category, description, expenseDate } = req.body;
    const userId = req.user!.id;

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0',
      });
      return;
    }

    // Get receipt URL from uploaded file
    let receiptUrl: string | undefined;
    if (req.file) {
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    // Get user's manager
    const user = await User.findByPk(userId);
    const managerId = user?.managerId;

    // Check for expense category cap for auto-approval
    const expenseAmount = parseFloat(amount);
    const categoryCap = await ExpenseCategoryCap.findOne({
      where: { category, isActive: true },
    });

    // Determine if auto-approval applies
    const shouldAutoApprove = categoryCap && expenseAmount <= parseFloat(categoryCap.capAmount.toString());

    // Create expense with appropriate status
    const expense = await Expense.create({
      userId,
      amount: expenseAmount,
      category,
      description,
      expenseDate,
      receiptUrl,
      status: shouldAutoApprove ? RequestStatus.APPROVED : RequestStatus.PENDING,
      approverId: undefined, // No approver for auto-approved or pending expenses
      approvedRejectedAt: shouldAutoApprove ? new Date() : undefined,
      comments: shouldAutoApprove ? 'Auto-approved (within category cap limit)' : undefined,
    });

    // Create appropriate notification
    if (shouldAutoApprove) {
      // Notify employee that expense was auto-approved
      await Notification.create({
        userId,
        type: 'expense',
        title: 'Expense Auto-Approved',
        message: `Your expense claim of ₹${amount} for ${category} has been auto-approved (within cap limit of ₹${categoryCap.capAmount})`,
        actionUrl: `/expenses/${expense.id}`,
        isRead: false,
      });
      logger.info(`Expense auto-approved: ${expense.id} (amount: ${amount}, cap: ${categoryCap.capAmount})`);
    } else {
      // Create notification for manager for manual approval
      if (managerId) {
        await Notification.create({
          userId: managerId,
          type: 'expense',
          title: 'New Expense Claim',
          message: `${user?.fullName} has submitted an expense claim of ₹${amount} for ${category}${categoryCap ? ` (exceeds cap of ₹${categoryCap.capAmount})` : ''}`,
          actionUrl: `/expenses/${expense.id}`,
          isRead: false,
        });
      }
      logger.info(`Expense created (pending approval): ${expense.id} by user ${userId}`);
    }

    const expenseWithUser = await Expense.findByPk(expense.id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json({
      status: 'success',
      message: shouldAutoApprove
        ? 'Expense claim auto-approved (within category cap limit)'
        : 'Expense claim submitted successfully',
      data: { expense: expenseWithUser, autoApproved: shouldAutoApprove },
    });
  } catch (error) {
    logger.error('Submit expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while submitting expense',
    });
  }
};

/**
 * Get all expenses (with filters)
 * GET /api/expenses
 */
export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, userId, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Role-based filtering
    if (req.user?.role === 'employee') {
      where.userId = req.user.id;
    } else if (req.user?.role === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      subordinateIds.push(req.user.id);
      where.userId = { [Op.in]: subordinateIds };
    }

    // Apply filters
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.expenseDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        expenses,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching expenses',
    });
  }
};

/**
 * Get user's own expenses
 * GET /api/expenses/my-expenses
 */
export const getMyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, category, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (status) where.status = status;
    if (category) where.category = category;

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: Number(limit),
    });

    res.status(200).json({
      status: 'success',
      data: {
        expenses,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get my expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching your expenses',
    });
  }
};

/**
 * Get pending expenses for approval
 * GET /api/expenses/pending
 */
export const getPendingExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { status: RequestStatus.PENDING };

    // Managers can only see their team's pending expenses
    if (req.user?.role === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      where.userId = { [Op.in]: subordinateIds };
    }

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['created_at', 'ASC']],
      offset,
      limit: Number(limit),
    });

    res.status(200).json({
      status: 'success',
      data: {
        expenses,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get pending expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching pending expenses',
    });
  }
};

/**
 * Get expense by ID
 * GET /api/expenses/:id
 */
export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!expense) {
      res.status(404).json({
        status: 'error',
        message: 'Expense not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { expense },
    });
  } catch (error) {
    logger.error('Get expense by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching expense',
    });
  }
};

/**
 * Update expense (only pending)
 * PUT /api/expenses/:id
 */
export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, category, description, expenseDate, receiptUrl } = req.body;
    const userId = req.user!.id;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      res.status(404).json({
        status: 'error',
        message: 'Expense not found',
      });
      return;
    }

    // Only owner can update
    if (expense.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'You can only update your own expenses',
      });
      return;
    }

    // Can only update pending expenses
    if (expense.status !== RequestStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Only pending expenses can be updated',
      });
      return;
    }

    await expense.update({
      amount: amount || expense.amount,
      category: category || expense.category,
      description: description || expense.description,
      expenseDate: expenseDate || expense.expenseDate,
      receiptUrl: receiptUrl !== undefined ? receiptUrl : expense.receiptUrl,
    });

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Expense updated successfully',
      data: { expense: updatedExpense },
    });
  } catch (error) {
    logger.error('Update expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating expense',
    });
  }
};

/**
 * Approve expense
 * PUT /api/expenses/:id/approve
 */
export const approveExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user!.id;
    const approverRole = req.user!.role;

    const expense = await Expense.findByPk(id, {
      include: [{ association: 'user' }],
    });

    if (!expense) {
      res.status(404).json({
        status: 'error',
        message: 'Expense not found',
      });
      return;
    }

    if (expense.status !== RequestStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Expense has already been processed',
      });
      return;
    }

    // Authorization check: Managers can only approve their team members' expenses
    if (approverRole === UserRole.MANAGER) {
      const employee = await User.findByPk(expense.userId);
      if (!employee || employee.managerId !== approverId) {
        res.status(403).json({
          status: 'error',
          message: 'You can only approve expenses for your team members',
        });
        return;
      }
    }

    // Update expense
    await expense.update({
      status: RequestStatus.APPROVED,
      approverId,
      approvedRejectedAt: new Date(),
      comments,
    });

    // Create notification for employee
    await Notification.create({
      userId: expense.userId,
      type: 'expense',
      title: 'Expense Approved',
      message: `Your expense claim of ₹${expense.amount} has been approved`,
      actionUrl: `/expenses/${expense.id}`,
      isRead: false,
    });

    logger.info(`Expense approved: ${id} by ${approverId}`);

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Expense approved successfully',
      data: { expense: updatedExpense },
    });
  } catch (error) {
    logger.error('Approve expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while approving expense',
    });
  }
};

/**
 * Reject expense
 * PUT /api/expenses/:id/reject
 */
export const rejectExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user!.id;
    const approverRole = req.user!.role;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      res.status(404).json({
        status: 'error',
        message: 'Expense not found',
      });
      return;
    }

    if (expense.status !== RequestStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Expense has already been processed',
      });
      return;
    }

    // Authorization check
    if (approverRole === UserRole.MANAGER) {
      const employee = await User.findByPk(expense.userId);
      if (!employee || employee.managerId !== approverId) {
        res.status(403).json({
          status: 'error',
          message: 'You can only reject expenses for your team members',
        });
        return;
      }
    }

    // Update expense
    await expense.update({
      status: RequestStatus.REJECTED,
      approverId,
      approvedRejectedAt: new Date(),
      comments: comments || 'Rejected',
    });

    // Create notification for employee
    await Notification.create({
      userId: expense.userId,
      type: 'expense',
      title: 'Expense Rejected',
      message: `Your expense claim of ₹${expense.amount} has been rejected`,
      actionUrl: `/expenses/${expense.id}`,
      isRead: false,
    });

    logger.info(`Expense rejected: ${id} by ${approverId}`);

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Expense rejected',
      data: { expense: updatedExpense },
    });
  } catch (error) {
    logger.error('Reject expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while rejecting expense',
    });
  }
};

/**
 * Cancel expense
 * PUT /api/expenses/:id/cancel
 */
export const cancelExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      res.status(404).json({
        status: 'error',
        message: 'Expense not found',
      });
      return;
    }

    // Only owner or admin can cancel
    if (expense.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'You can only cancel your own expenses',
      });
      return;
    }

    if (expense.status !== RequestStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Only pending expenses can be cancelled',
      });
      return;
    }

    await expense.update({ status: RequestStatus.CANCELLED });

    logger.info(`Expense cancelled: ${id} by user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Expense cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling expense',
    });
  }
};

/**
 * Get expense summary
 * GET /api/expenses/summary
 */
export const getExpenseSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    let userFilter: any = { userId };

    if (userRole === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      subordinateIds.push(userId);
      userFilter = { userId: { [Op.in]: subordinateIds } };
    } else if (userRole === 'admin') {
      userFilter = {};
    }

    // Get counts and totals
    const pendingExpenses = await Expense.findAll({
      where: { ...userFilter, status: RequestStatus.PENDING },
      attributes: ['amount'],
    });

    const approvedExpenses = await Expense.findAll({
      where: {
        ...userFilter,
        status: RequestStatus.APPROVED,
        expenseDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      attributes: ['amount'],
    });

    const monthlyExpenses = await Expense.findAll({
      where: {
        ...userFilter,
        expenseDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      attributes: ['amount'],
    });

    const totalPending = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalApproved = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalPending,
          totalApproved,
          monthlyTotal,
          pendingCount: pendingExpenses.length,
          approvedCount: approvedExpenses.length,
        },
      },
    });
  } catch (error) {
    logger.error('Get expense summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching expense summary',
    });
  }
};

/**
 * Export expense report to CSV
 * GET /api/expenses/export
 */
export const exportExpenseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, category } = req.query;
    const requestUserId = req.user!.id;
    const userRole = req.user!.role;

    const where: any = {};

    // Role-based filtering
    if (userRole === 'employee') {
      where.userId = requestUserId;
    } else if (userRole === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: requestUserId },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      subordinateIds.push(requestUserId);
      where.userId = { [Op.in]: subordinateIds };
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.expenseDate = { [Op.between]: [startDate, endDate] };
    }

    const expenses = await Expense.findAll({
      where,
      include: [
        { association: 'user', attributes: ['firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
    });

    // Generate CSV
    const csvHeader = 'Employee,Email,Amount,Category,Description,Expense Date,Receipt,Status,Approver,Comments,Submitted On\n';
    const csvRows = expenses.map((expense: any) => {
      const user = expense.user;
      const approver = expense.approver;

      const formatDate = (dateValue: any, formatStr: string) => {
        try {
          if (!dateValue) return '-';
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return '-';
          return format(date, formatStr);
        } catch {
          return '-';
        }
      };

      return [
        `"${user?.firstName || ''} ${user?.lastName || ''}"`,
        `"${user?.email || ''}"`,
        expense.amount || 0,
        expense.category || '-',
        `"${(expense.description || '').replace(/"/g, '""')}"`,
        formatDate(expense.expenseDate, 'yyyy-MM-dd'),
        expense.receiptUrl ? 'Yes' : 'No',
        expense.status || '-',
        approver ? `"${approver.firstName} ${approver.lastName}"` : '-',
        expense.comments ? `"${expense.comments.replace(/"/g, '""')}"` : '-',
        formatDate(expense.createdAt, 'yyyy-MM-dd HH:mm'),
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    res.send(csv);

    logger.info(`Expense report exported by user ${requestUserId}`);
  } catch (error) {
    logger.error('Export expense report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while exporting expense report',
    });
  }
};

/**
 * Delete expense
 * DELETE /api/expenses/:id
 */
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      res.status(404).json({
        status: 'error',
        message: 'Expense not found',
      });
      return;
    }

    // Only owner or admin can delete
    if (expense.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'You can only delete your own expenses',
      });
      return;
    }

    // Can only delete pending expenses
    if (expense.status !== RequestStatus.PENDING && req.user?.role !== 'admin') {
      res.status(400).json({
        status: 'error',
        message: 'Only pending expenses can be deleted',
      });
      return;
    }

    await expense.destroy();

    logger.info(`Expense deleted: ${id} by user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    logger.error('Delete expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting expense',
    });
  }
};
