import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { LeaveRequest, LeaveBalance, User, LeaveApproval } from '../models';
import { LeaveType, RequestStatus, UserRole } from '../types/enums';
import { ApprovalStatus } from '../models/LeaveApproval';
import logger from '../utils/logger';
import { parseISO, format, eachDayOfInterval, isSunday } from 'date-fns';
import {
  sendLeaveRequestNotification,
  sendLeaveApprovalNotification,
  sendLeaveRejectionNotification,
} from '../services/email.service';
import { createNotification } from '../services/notification.service';

/**
 * Helper function to count days excluding Sundays
 */
const countDaysExcludingSundays = (startDate: Date, endDate: Date): number => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isSunday(day)).length;
};

/**
 * Helper function to get the approval chain for a user
 * For Employee: Manager -> All Admins above manager
 * For Manager: All Admins
 */
const getApprovalChain = async (userId: number): Promise<User[]> => {
  const user = await User.findByPk(userId, {
    include: [{ association: 'manager' }],
  });

  if (!user) return [];

  const approvalChain: User[] = [];

  if (user.role === UserRole.EMPLOYEE) {
    // Employee: First approver is direct manager
    if (user.managerId) {
      const manager = await User.findByPk(user.managerId);
      if (manager) {
        approvalChain.push(manager);
      }
    }

    // Then all admins
    const admins = await User.findAll({
      where: {
        role: UserRole.ADMIN,
        status: 'active',
        id: { [Op.ne]: userId }, // Exclude the requester if admin
      },
      order: [['id', 'ASC']],
    });
    approvalChain.push(...admins);
  } else if (user.role === UserRole.MANAGER) {
    // Manager: All admins need to approve
    const admins = await User.findAll({
      where: {
        role: UserRole.ADMIN,
        status: 'active',
        id: { [Op.ne]: userId }, // Exclude the requester if admin
      },
      order: [['id', 'ASC']],
    });
    approvalChain.push(...admins);
  }

  // Remove duplicates based on id
  const uniqueApprovers = approvalChain.filter(
    (approver, index, self) => index === self.findIndex((a) => a.id === approver.id)
  );

  return uniqueApprovers;
};

/**
 * Helper function to create approval records for a leave request
 */
const createApprovalRecords = async (leaveRequestId: number, approvers: User[]): Promise<void> => {
  for (let i = 0; i < approvers.length; i++) {
    await LeaveApproval.create({
      leaveRequestId,
      approverId: approvers[i].id,
      approvalOrder: i + 1,
      status: ApprovalStatus.PENDING,
    });
  }
};

/**
 * Apply for leave
 * POST /api/leaves
 */
export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leaveType, startDate, endDate, reason, halfDaySession, documentUrl } = req.body;
    const isHalfDay = req.body.isHalfDay === true;
    const userId = req.user!.id;

    // Calculate number of days (excluding Sundays)
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    let daysCount = countDaysExcludingSundays(start, end);

    // Handle half-day leave
    if (isHalfDay) {
      if (!halfDaySession) {
        res.status(400).json({
          status: 'error',
          message: 'Half-day session (morning/afternoon) is required for half-day leave',
        });
        return;
      }

      // For half-day, start and end date must be the same
      if (startDate !== endDate) {
        res.status(400).json({
          status: 'error',
          message: 'Half-day leave can only be applied for a single day',
        });
        return;
      }

      // Check if the selected day is a Sunday
      if (isSunday(start)) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot apply leave on Sunday',
        });
        return;
      }

      daysCount = 0.5;
    }

    if (daysCount <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid date range',
      });
      return;
    }

    // Check for overlapping leave requests (pending or approved)
    const overlappingLeave = await LeaveRequest.findOne({
      where: {
        userId,
        status: { [Op.in]: [RequestStatus.PENDING, RequestStatus.APPROVED] },
        [Op.or]: [
          // New leave starts within existing leave
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: startDate },
          },
          // New leave ends within existing leave
          {
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: endDate },
          },
          // New leave completely contains existing leave
          {
            startDate: { [Op.gte]: startDate },
            endDate: { [Op.lte]: endDate },
          },
        ],
      },
    });

    if (overlappingLeave) {
      res.status(400).json({
        status: 'error',
        message: `You already have a leave request (${overlappingLeave.status}) for the selected dates`,
      });
      return;
    }

    // Get user's leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      where: { userId, year: currentYear },
    });

    if (!leaveBalance) {
      res.status(400).json({
        status: 'error',
        message: 'Leave balance not found for current year',
      });
      return;
    }

    // Check if user has sufficient balance
    let availableLeave = 0;
    switch (leaveType) {
      case LeaveType.SICK:
        availableLeave = Number(leaveBalance.sickLeave);
        break;
      case LeaveType.CASUAL:
        availableLeave = Number(leaveBalance.casualLeave);
        break;
      case LeaveType.EARNED:
        availableLeave = Number(leaveBalance.earnedLeave);
        break;
      case LeaveType.COMP_OFF:
        availableLeave = Number(leaveBalance.compOff);
        break;
      case LeaveType.PATERNITY:
      case LeaveType.MATERNITY:
        availableLeave = Number(leaveBalance.paternityMaternity);
        break;
    }

    if (daysCount > availableLeave) {
      res.status(400).json({
        status: 'error',
        message: `Insufficient leave balance. Available: ${availableLeave} days, Requested: ${daysCount} days`,
      });
      return;
    }

    // Get user
    const user = await User.findByPk(userId);

    // Get approval chain for this user
    const approvalChain = await getApprovalChain(userId);

    // Create leave request with approval level tracking
    const leaveRequest = await LeaveRequest.create({
      userId,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      status: RequestStatus.PENDING,
      isHalfDay: isHalfDay || false,
      halfDaySession: isHalfDay ? halfDaySession : null,
      documentUrl,
      currentApprovalLevel: 0,
      totalApprovalLevels: approvalChain.length,
    });

    // Create approval records for each approver in the chain
    await createApprovalRecords(leaveRequest.id, approvalChain);

    // Notify the first approver in the chain (if any)
    if (approvalChain.length > 0) {
      const firstApprover = approvalChain[0];

      await createNotification({
        userId: firstApprover.id,
        type: 'leave',
        title: 'New Leave Request - Approval Required',
        message: `${user?.fullName} has requested ${daysCount} day(s) of ${leaveType} leave and requires your approval`,
        actionUrl: `/leaves`,
        relatedId: leaveRequest.id,
        relatedType: 'leave',
      });

      // Send email notification to first approver
      await sendLeaveRequestNotification(
        firstApprover.email,
        firstApprover.fullName,
        user?.fullName || 'Employee',
        leaveType,
        format(new Date(startDate), 'MMM dd, yyyy'),
        format(new Date(endDate), 'MMM dd, yyyy'),
        daysCount,
        reason
      );
    }

    logger.info(`Leave request created: ${leaveRequest.id} by user ${userId} with ${approvalChain.length} approvers`);

    const requestWithUser = await LeaveRequest.findByPk(leaveRequest.id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json({
      status: 'success',
      message: 'Leave request submitted successfully',
      data: { leaveRequest: requestWithUser },
    });
  } catch (error) {
    logger.error('Apply leave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while applying for leave',
    });
  }
};

/**
 * Get all leave requests (with filters)
 * GET /api/leaves
 */
export const getAllLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, userId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Managers can see their team's requests, employees see only their own
    if (req.user?.role === 'employee') {
      where.userId = req.user.id;
    } else if (req.user?.role === 'manager') {
      // Get all subordinates
      const subordinates = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      subordinateIds.push(req.user.id); // Include manager's own requests

      where.userId = { [Op.in]: subordinateIds };
    }

    // Admin can see all, apply filters if provided
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.startDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          association: 'approvals',
          include: [{ association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        leaveRequests,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all leave requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching leave requests',
    });
  }
};

/**
 * Get leave request by ID
 * GET /api/leaves/:id
 */
export const getLeaveRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!leaveRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { leaveRequest },
    });
  } catch (error) {
    logger.error('Get leave request by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching leave request',
    });
  }
};

/**
 * Approve leave request (multi-level approval)
 * PUT /api/leaves/:id/approve
 */
export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user!.id;

    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: [
        { association: 'user' },
        {
          association: 'approvals',
          include: [{ association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['approvalOrder', 'ASC']],
        },
      ],
    });

    if (!leaveRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
      return;
    }

    if (leaveRequest.status !== RequestStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Leave request has already been processed',
      });
      return;
    }

    // Check if user is admin - admins can approve any leave directly
    const isAdmin = req.user!.role === 'admin';

    // Find the approval record for this approver
    const approval = await LeaveApproval.findOne({
      where: {
        leaveRequestId: Number(id),
        approverId,
      },
    });

    // If not admin and no approval record, deny access
    if (!approval && !isAdmin) {
      res.status(403).json({
        status: 'error',
        message: 'You are not authorized to approve this leave request',
      });
      return;
    }

    // If there's an approval record, check its status
    if (approval) {
      if (approval.status !== ApprovalStatus.PENDING) {
        res.status(400).json({
          status: 'error',
          message: 'You have already processed this leave request',
        });
        return;
      }

      // Check if it's this approver's turn (previous approvers must have approved)
      const previousApprovals = await LeaveApproval.findAll({
        where: {
          leaveRequestId: Number(id),
          approvalOrder: { [Op.lt]: approval.approvalOrder },
        },
      });

      const allPreviousApproved = previousApprovals.every(
        (prev) => prev.status === ApprovalStatus.APPROVED
      );

      if (!allPreviousApproved && !isAdmin) {
        res.status(400).json({
          status: 'error',
          message: 'Previous approvers must approve first before you can approve',
        });
        return;
      }

      // Update this approval record
      await approval.update({
        status: ApprovalStatus.APPROVED,
        comments,
        actedAt: new Date(),
      });
    }

    // Update current approval level
    const newLevel = (leaveRequest.currentApprovalLevel || 0) + 1;
    await leaveRequest.update({
      currentApprovalLevel: newLevel,
    });

    // Check if all approvers have approved (or if admin approved directly)
    const allApprovals = await LeaveApproval.findAll({
      where: { leaveRequestId: Number(id) },
    });

    const allApproved = allApprovals.length === 0 || allApprovals.every(
      (app) => app.status === ApprovalStatus.APPROVED
    );

    if (allApproved) {
      // Final approval - mark leave as approved and deduct balance
      await leaveRequest.update({
        status: RequestStatus.APPROVED,
        approverId, // Last approver
        approvedRejectedAt: new Date(),
        comments,
      });

      // Deduct leave balance
      const currentYear = new Date().getFullYear();
      const leaveBalance = await LeaveBalance.findOne({
        where: { userId: leaveRequest.userId, year: currentYear },
      });

      if (leaveBalance) {
        const deductionMap: any = {
          [LeaveType.SICK]: 'sickLeave',
          [LeaveType.CASUAL]: 'casualLeave',
          [LeaveType.EARNED]: 'earnedLeave',
          [LeaveType.COMP_OFF]: 'compOff',
          [LeaveType.PATERNITY]: 'paternityMaternity',
        };

        const field = deductionMap[leaveRequest.leaveType];
        if (field) {
          await leaveBalance.update({
            [field]: Number(leaveBalance[field as keyof LeaveBalance]) - leaveRequest.daysCount,
          });
        }
      }

      // Notify employee of final approval
      await createNotification({
        userId: leaveRequest.userId,
        type: 'leave',
        title: 'Leave Request Approved',
        message: `Your leave request for ${leaveRequest.daysCount} day(s) has been fully approved by all approvers`,
        actionUrl: `/leaves`,
        relatedId: leaveRequest.id,
        relatedType: 'leave',
      });

      // Send email notification to employee
      const employee = await User.findByPk(leaveRequest.userId);
      const approver = await User.findByPk(approverId);
      if (employee && approver) {
        await sendLeaveApprovalNotification(
          employee.email,
          employee.fullName,
          leaveRequest.leaveType,
          format(new Date(leaveRequest.startDate), 'MMM dd, yyyy'),
          format(new Date(leaveRequest.endDate), 'MMM dd, yyyy'),
          leaveRequest.daysCount,
          approver.fullName,
          comments
        );
      }

      logger.info(`Leave request fully approved: ${id} by ${approverId}`);
    } else {
      // Notify next approver
      const nextApproval = await LeaveApproval.findOne({
        where: {
          leaveRequestId: Number(id),
          status: ApprovalStatus.PENDING,
        },
        order: [['approvalOrder', 'ASC']],
      });

      if (nextApproval) {
        const nextApprover = await User.findByPk(nextApproval.approverId);
        const employee = await User.findByPk(leaveRequest.userId);

        if (nextApprover && employee) {
          await createNotification({
            userId: nextApprover.id,
            type: 'leave',
            title: 'Leave Request - Approval Required',
            message: `${employee.fullName}'s leave request requires your approval (Level ${nextApproval.approvalOrder} of ${leaveRequest.totalApprovalLevels})`,
            actionUrl: `/leaves`,
            relatedId: leaveRequest.id,
            relatedType: 'leave',
          });

          await sendLeaveRequestNotification(
            nextApprover.email,
            nextApprover.fullName,
            employee.fullName,
            leaveRequest.leaveType,
            format(new Date(leaveRequest.startDate), 'MMM dd, yyyy'),
            format(new Date(leaveRequest.endDate), 'MMM dd, yyyy'),
            leaveRequest.daysCount,
            leaveRequest.reason
          );
        }
      }

      // Notify employee of partial approval
      await createNotification({
        userId: leaveRequest.userId,
        type: 'leave',
        title: 'Leave Request Partially Approved',
        message: `Your leave request has been approved by Level ${newLevel} of ${leaveRequest.totalApprovalLevels} approvers`,
        actionUrl: `/leaves`,
        relatedId: leaveRequest.id,
        relatedType: 'leave',
      });

      logger.info(`Leave request partially approved: ${id} by ${approverId} (Level ${newLevel}/${leaveRequest.totalApprovalLevels})`);
    }

    const updatedRequest = await LeaveRequest.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          association: 'approvals',
          include: [{ association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: allApproved
        ? 'Leave request fully approved'
        : `Leave request approved by Level ${newLevel}/${leaveRequest.totalApprovalLevels}. Awaiting further approvals.`,
      data: { leaveRequest: updatedRequest },
    });
  } catch (error) {
    logger.error('Approve leave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while approving leave request',
    });
  }
};

/**
 * Reject leave request (multi-level approval - any approver can reject)
 * PUT /api/leaves/:id/reject
 */
export const rejectLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user!.id;

    const leaveRequest = await LeaveRequest.findByPk(id, {
      include: [{ association: 'user' }],
    });

    if (!leaveRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
      return;
    }

    if (leaveRequest.status !== RequestStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'Leave request has already been processed',
      });
      return;
    }

    // Check if user is admin - admins can reject any leave directly
    const isAdmin = req.user!.role === 'admin';

    // Find the approval record for this approver
    const approval = await LeaveApproval.findOne({
      where: {
        leaveRequestId: Number(id),
        approverId,
      },
    });

    // If not admin and no approval record, deny access
    if (!approval && !isAdmin) {
      res.status(403).json({
        status: 'error',
        message: 'You are not authorized to reject this leave request',
      });
      return;
    }

    // If there's an approval record, check its status and update it
    if (approval) {
      if (approval.status !== ApprovalStatus.PENDING) {
        res.status(400).json({
          status: 'error',
          message: 'You have already processed this leave request',
        });
        return;
      }

      // Update this approval record as rejected
      await approval.update({
        status: ApprovalStatus.REJECTED,
        comments,
        actedAt: new Date(),
      });
    }

    // Update leave request as rejected (any rejection rejects the whole request)
    await leaveRequest.update({
      status: RequestStatus.REJECTED,
      approverId,
      approvedRejectedAt: new Date(),
      comments: comments || 'Rejected',
    });

    // Create notification for employee
    await createNotification({
      userId: leaveRequest.userId,
      type: 'leave',
      title: 'Leave Request Rejected',
      message: `Your leave request for ${leaveRequest.daysCount} day(s) has been rejected`,
      actionUrl: `/leaves`,
      relatedId: leaveRequest.id,
      relatedType: 'leave',
    });

    // Send email notification to employee
    const employee = await User.findByPk(leaveRequest.userId);
    const approver = await User.findByPk(approverId);
    if (employee && approver) {
      await sendLeaveRejectionNotification(
        employee.email,
        employee.fullName,
        leaveRequest.leaveType,
        format(new Date(leaveRequest.startDate), 'MMM dd, yyyy'),
        format(new Date(leaveRequest.endDate), 'MMM dd, yyyy'),
        leaveRequest.daysCount,
        approver.fullName,
        comments || 'No reason provided'
      );
    }

    logger.info(`Leave request rejected: ${id} by ${approverId}`);

    const updatedRequest = await LeaveRequest.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          association: 'approvals',
          include: [{ association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Leave request rejected',
      data: { leaveRequest: updatedRequest },
    });
  } catch (error) {
    logger.error('Reject leave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while rejecting leave request',
    });
  }
};

/**
 * Get user's leave balance
 * GET /api/leaves/balance
 */
export const getLeaveBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : req.user!.id;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const leaveBalance = await LeaveBalance.findOne({
      where: { userId, year },
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!leaveBalance) {
      // Create leave balance for the year if it doesn't exist (Total: 25 = 12 sick + 12 casual + 1 birthday)
      const newBalance = await LeaveBalance.create({
        userId,
        year,
        sickLeave: 12.0,
        casualLeave: 12.0,
        earnedLeave: 0.0,
        compOff: 0.0,
        paternityMaternity: 0.0,
        birthdayLeave: 1.0,
      });

      res.status(200).json({
        status: 'success',
        data: { leaveBalance: newBalance },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { leaveBalance },
    });
  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching leave balance',
    });
  }
};

/**
 * Cancel leave request (by employee)
 * PUT /api/leaves/:id/cancel
 */
export const cancelLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const leaveRequest = await LeaveRequest.findByPk(id);

    if (!leaveRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
      return;
    }

    // Only the requester can cancel
    if (leaveRequest.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'You can only cancel your own leave requests',
      });
      return;
    }

    if (leaveRequest.status !== RequestStatus.PENDING && leaveRequest.status !== RequestStatus.APPROVED) {
      res.status(400).json({
        status: 'error',
        message: 'Only pending or approved leave requests can be cancelled',
      });
      return;
    }

    // If leave was approved, restore the balance
    if (leaveRequest.status === RequestStatus.APPROVED) {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await LeaveBalance.findOne({
        where: { userId: leaveRequest.userId, year: currentYear },
      });

      if (leaveBalance) {
        const restoreMap: any = {
          [LeaveType.SICK]: 'sickLeave',
          [LeaveType.CASUAL]: 'casualLeave',
          [LeaveType.EARNED]: 'earnedLeave',
          [LeaveType.COMP_OFF]: 'compOff',
          [LeaveType.PATERNITY]: 'paternityMaternity',
          // MATERNITY maps to same value as PATERNITY, so only one key needed
        };

        const field = restoreMap[leaveRequest.leaveType];
        if (field) {
          await leaveBalance.update({
            [field]: Number(leaveBalance[field as keyof LeaveBalance]) + leaveRequest.daysCount,
          });
        }
      }
    }

    await leaveRequest.update({ status: RequestStatus.CANCELLED });

    logger.info(`Leave request cancelled: ${id} by user ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Leave request cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel leave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling leave request',
    });
  }
};

/**
 * Get leave history (past leaves)
 * GET /api/leaves/history
 */
export const getLeaveHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { year, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {
      userId,
      endDate: { [Op.lt]: new Date() }, // Past leaves only
    };

    if (year) {
      const startOfYear = new Date(Number(year), 0, 1);
      const endOfYear = new Date(Number(year), 11, 31);
      where.startDate = { [Op.between]: [startOfYear, endOfYear] };
    }

    const { count, rows: leaveHistory } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['start_date', 'DESC']],
      offset,
      limit: Number(limit),
    });

    res.status(200).json({
      status: 'success',
      data: {
        items: leaveHistory,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get leave history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching leave history',
    });
  }
};

/**
 * Export leave report to CSV
 * GET /api/leaves/export
 */
export const exportLeaveReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, userId } = req.query;
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

    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.startDate = { [Op.between]: [startDate, endDate] };
    }

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        { association: 'user', attributes: ['firstName', 'lastName', 'email'] },
        { association: 'approver', attributes: ['firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
    });

    // Generate CSV
    const csvHeader = 'Employee,Email,Leave Type,Start Date,End Date,Days,Is Half Day,Session,Reason,Status,Approver,Comments,Applied On\n';
    const csvRows = leaveRequests.map((leave: any) => {
      const user = leave.user;
      const approver = leave.approver;

      // Safe date formatting
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
        leave.leaveType || '-',
        formatDate(leave.startDate, 'yyyy-MM-dd'),
        formatDate(leave.endDate, 'yyyy-MM-dd'),
        leave.daysCount || 0,
        leave.isHalfDay ? 'Yes' : 'No',
        leave.halfDaySession || '-',
        `"${(leave.reason || '').replace(/"/g, '""')}"`,
        leave.status || '-',
        approver ? `"${approver.firstName} ${approver.lastName}"` : '-',
        leave.comments ? `"${leave.comments.replace(/"/g, '""')}"` : '-',
        formatDate(leave.createdAt, 'yyyy-MM-dd HH:mm'),
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leave-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    res.send(csv);

    logger.info(`Leave report exported by user ${requestUserId}`);
  } catch (error) {
    logger.error('Export leave report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while exporting leave report',
    });
  }
};
