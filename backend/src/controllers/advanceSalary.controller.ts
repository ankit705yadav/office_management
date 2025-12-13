import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AdvanceSalaryRequest, { AdvanceSalaryStatus } from '../models/AdvanceSalaryRequest';
import { User, Notification } from '../models';
import { UserRole } from '../types/enums';
import logger from '../utils/logger';
import { format } from 'date-fns';

/**
 * Request salary advance
 * POST /api/advance-salary
 */
export const requestAdvance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, reason, requestedForMonth, requestedForYear } = req.body;
    const userId = req.user!.id;

    // Validate required fields
    if (!amount || !reason || !requestedForMonth || !requestedForYear) {
      res.status(400).json({
        status: 'error',
        message: 'Amount, reason, month, and year are required',
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

    // Validate month
    if (requestedForMonth < 1 || requestedForMonth > 12) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid month. Must be between 1 and 12',
      });
      return;
    }

    // Check for existing pending request for the same month/year
    const existingRequest = await AdvanceSalaryRequest.findOne({
      where: {
        userId,
        requestedForMonth,
        requestedForYear,
        status: { [Op.in]: [AdvanceSalaryStatus.PENDING, AdvanceSalaryStatus.APPROVED] },
      },
    });

    if (existingRequest) {
      res.status(400).json({
        status: 'error',
        message: 'You already have a pending or approved advance request for this month',
      });
      return;
    }

    // Create advance salary request
    const advanceRequest = await AdvanceSalaryRequest.create({
      userId,
      amount: Number(amount),
      reason,
      requestedForMonth,
      requestedForYear,
    });

    // Get user's manager for notification
    const user = await User.findByPk(userId);
    const managerId = user?.managerId;

    // Create notification for manager
    if (managerId) {
      await Notification.create({
        userId: managerId,
        type: 'advance_salary',
        title: 'New Advance Salary Request',
        message: `${user?.fullName} has requested an advance of ₹${Number(amount).toLocaleString()}`,
        actionUrl: `/payroll?tab=advance`,
        isRead: false,
      });
    }

    // Fetch with associations
    const requestWithDetails = await AdvanceSalaryRequest.findByPk(advanceRequest.id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    logger.info(`Advance salary request created: ${advanceRequest.id} by user ${userId}`);

    res.status(201).json({
      status: 'success',
      message: 'Advance salary request submitted successfully',
      data: { advanceRequest: requestWithDetails },
    });
  } catch (error) {
    logger.error('Request advance salary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while submitting advance request',
    });
  }
};

/**
 * Get all advance salary requests (with filters)
 * GET /api/advance-salary
 */
export const getAllAdvanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, userId, month, year, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Role-based filtering
    if (req.user?.role === 'employee') {
      where.userId = req.user.id;
    } else if (req.user?.role === 'manager') {
      // Managers can see their own and subordinates' requests
      const subordinates = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      subordinateIds.push(req.user.id);
      where.userId = { [Op.in]: subordinateIds };
    }
    // Admin can see all

    // Apply filters
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (month) where.requestedForMonth = month;
    if (year) where.requestedForYear = year;

    const { count, rows: advanceRequests } = await AdvanceSalaryRequest.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'disburser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        advanceRequests,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all advance requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching advance requests',
    });
  }
};

/**
 * Get my advance salary requests
 * GET /api/advance-salary/my-requests
 */
export const getMyAdvanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: advanceRequests } = await AdvanceSalaryRequest.findAndCountAll({
      where: { userId },
      include: [
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'disburser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        advanceRequests,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get my advance requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching your advance requests',
    });
  }
};

/**
 * Get pending advance requests for approval
 * GET /api/advance-salary/pending
 */
export const getPendingAdvanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { status: AdvanceSalaryStatus.PENDING };

    // Role-based filtering
    if (req.user?.role === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      where.userId = { [Op.in]: subordinateIds };
    }
    // Admin can see all pending

    const { count, rows: advanceRequests } = await AdvanceSalaryRequest.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        advanceRequests,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get pending advance requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching pending advance requests',
    });
  }
};

/**
 * Approve advance salary request
 * PUT /api/advance-salary/:id/approve
 */
export const approveAdvance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user!.id;
    const approverRole = req.user!.role;

    const advanceRequest = await AdvanceSalaryRequest.findByPk(id, {
      include: [{ association: 'user' }],
    });

    if (!advanceRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Advance salary request not found',
      });
      return;
    }

    if (advanceRequest.status !== AdvanceSalaryStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'This request has already been processed',
      });
      return;
    }

    // Authorization check: Managers can only approve their team members' requests
    if (approverRole === UserRole.MANAGER) {
      const employee = await User.findByPk(advanceRequest.userId);
      if (!employee || employee.managerId !== approverId) {
        res.status(403).json({
          status: 'error',
          message: 'You can only approve requests from your team members',
        });
        return;
      }
    }

    // Update request
    await advanceRequest.update({
      status: AdvanceSalaryStatus.APPROVED,
      approverId,
      approvedRejectedAt: new Date(),
      comments,
    });

    // Create notification for employee
    await Notification.create({
      userId: advanceRequest.userId,
      type: 'advance_salary',
      title: 'Advance Salary Request Approved',
      message: `Your advance salary request of ₹${advanceRequest.amount.toLocaleString()} has been approved`,
      actionUrl: `/payroll?tab=advance`,
      isRead: false,
    });

    logger.info(`Advance request approved: ${id} by ${approverId}`);

    const updatedRequest = await AdvanceSalaryRequest.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Advance salary request approved successfully',
      data: { advanceRequest: updatedRequest },
    });
  } catch (error) {
    logger.error('Approve advance request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while approving the request',
    });
  }
};

/**
 * Reject advance salary request
 * PUT /api/advance-salary/:id/reject
 */
export const rejectAdvance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user!.id;
    const approverRole = req.user!.role;

    if (!comments?.trim()) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide a reason for rejection',
      });
      return;
    }

    const advanceRequest = await AdvanceSalaryRequest.findByPk(id);

    if (!advanceRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Advance salary request not found',
      });
      return;
    }

    if (advanceRequest.status !== AdvanceSalaryStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'This request has already been processed',
      });
      return;
    }

    // Authorization check for managers
    if (approverRole === UserRole.MANAGER) {
      const employee = await User.findByPk(advanceRequest.userId);
      if (!employee || employee.managerId !== approverId) {
        res.status(403).json({
          status: 'error',
          message: 'You can only reject requests from your team members',
        });
        return;
      }
    }

    // Update request
    await advanceRequest.update({
      status: AdvanceSalaryStatus.REJECTED,
      approverId,
      approvedRejectedAt: new Date(),
      comments,
    });

    // Create notification for employee
    await Notification.create({
      userId: advanceRequest.userId,
      type: 'advance_salary',
      title: 'Advance Salary Request Rejected',
      message: `Your advance salary request of ₹${advanceRequest.amount.toLocaleString()} has been rejected`,
      actionUrl: `/payroll?tab=advance`,
      isRead: false,
    });

    logger.info(`Advance request rejected: ${id} by ${approverId}`);

    const updatedRequest = await AdvanceSalaryRequest.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Advance salary request rejected',
      data: { advanceRequest: updatedRequest },
    });
  } catch (error) {
    logger.error('Reject advance request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while rejecting the request',
    });
  }
};

/**
 * Mark advance as disbursed (Admin only)
 * PUT /api/advance-salary/:id/disburse
 */
export const markAsDisbursed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const disbursedBy = req.user!.id;

    const advanceRequest = await AdvanceSalaryRequest.findByPk(id);

    if (!advanceRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Advance salary request not found',
      });
      return;
    }

    if (advanceRequest.status !== AdvanceSalaryStatus.APPROVED) {
      res.status(400).json({
        status: 'error',
        message: 'Only approved requests can be marked as disbursed',
      });
      return;
    }

    // Update request
    await advanceRequest.update({
      status: AdvanceSalaryStatus.DISBURSED,
      disbursedBy,
      disbursedAt: new Date(),
    });

    // Create notification for employee
    await Notification.create({
      userId: advanceRequest.userId,
      type: 'advance_salary',
      title: 'Advance Salary Disbursed',
      message: `Your advance salary of ₹${advanceRequest.amount.toLocaleString()} has been disbursed`,
      actionUrl: `/payroll?tab=advance`,
      isRead: false,
    });

    logger.info(`Advance marked as disbursed: ${id} by ${disbursedBy}`);

    const updatedRequest = await AdvanceSalaryRequest.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'disburser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Advance salary marked as disbursed',
      data: { advanceRequest: updatedRequest },
    });
  } catch (error) {
    logger.error('Mark as disbursed error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the request',
    });
  }
};

/**
 * Cancel advance salary request (by employee)
 * PUT /api/advance-salary/:id/cancel
 */
export const cancelAdvanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const advanceRequest = await AdvanceSalaryRequest.findByPk(id);

    if (!advanceRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Advance salary request not found',
      });
      return;
    }

    // Only the requester can cancel, or admin
    if (advanceRequest.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'You can only cancel your own requests',
      });
      return;
    }

    if (advanceRequest.status !== AdvanceSalaryStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Only pending requests can be cancelled',
      });
      return;
    }

    await advanceRequest.update({ status: AdvanceSalaryStatus.CANCELLED });

    logger.info(`Advance request cancelled: ${id} by user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Advance salary request cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel advance request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling the request',
    });
  }
};

/**
 * Get advance salary summary
 * GET /api/advance-salary/summary
 */
export const getAdvanceSalarySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get counts for current month
    const pendingCount = await AdvanceSalaryRequest.count({
      where: {
        status: AdvanceSalaryStatus.PENDING,
      },
    });

    const approvedCount = await AdvanceSalaryRequest.count({
      where: {
        status: AdvanceSalaryStatus.APPROVED,
        requestedForMonth: currentMonth,
        requestedForYear: currentYear,
      },
    });

    const disbursedCount = await AdvanceSalaryRequest.count({
      where: {
        status: AdvanceSalaryStatus.DISBURSED,
        requestedForMonth: currentMonth,
        requestedForYear: currentYear,
      },
    });

    // Get total pending amount
    const pendingRequests = await AdvanceSalaryRequest.findAll({
      where: {
        status: AdvanceSalaryStatus.PENDING,
      },
      attributes: ['amount'],
    });

    const totalPending = pendingRequests.reduce(
      (sum, req) => sum + Number(req.amount),
      0
    );

    // Get total approved amount this month
    const approvedRequests = await AdvanceSalaryRequest.findAll({
      where: {
        status: AdvanceSalaryStatus.APPROVED,
        requestedForMonth: currentMonth,
        requestedForYear: currentYear,
      },
      attributes: ['amount'],
    });

    const totalApproved = approvedRequests.reduce(
      (sum, req) => sum + Number(req.amount),
      0
    );

    // Get total disbursed amount this month
    const disbursedRequests = await AdvanceSalaryRequest.findAll({
      where: {
        status: AdvanceSalaryStatus.DISBURSED,
        requestedForMonth: currentMonth,
        requestedForYear: currentYear,
      },
      attributes: ['amount'],
    });

    const totalDisbursed = disbursedRequests.reduce(
      (sum, req) => sum + Number(req.amount),
      0
    );

    res.status(200).json({
      status: 'success',
      data: {
        totalPending,
        totalApproved,
        totalDisbursed,
        pendingCount,
        approvedCount,
        disbursedCount,
      },
    });
  } catch (error) {
    logger.error('Get advance salary summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching summary',
    });
  }
};
