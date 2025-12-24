import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { format, startOfDay, endOfDay, subDays, parse } from 'date-fns';
import Attendance from '../models/Attendance';
import AttendanceRegularization from '../models/AttendanceRegularization';
import AttendanceSetting from '../models/AttendanceSetting';
import User from '../models/User';
import {
  AttendanceStatus,
  RegularizationStatus,
  UserRole,
} from '../types/enums';
import logger from '../utils/logger';
import {
  calculateWorkHours,
  isLateArrival,
  isEarlyDeparture,
  getAttendanceStatusForDate,
  generateMonthlyReport,
  getAttendanceSettings as getSettings,
} from '../services/attendance.service';
import { sendEmail } from '../services/email.service';
import { createNotification } from '../services/notification.service';

/**
 * Check in for the day
 * POST /api/attendance/check-in
 */
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { location } = req.body;
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    // Check if already checked in today
    const existing = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    // DEVELOPMENT MODE: Allow multiple check-ins for testing
    // if (existing && existing.checkInTime) {
    //   res.status(400).json({
    //     status: 'error',
    //     message: 'You have already checked in today',
    //     data: { attendance: existing },
    //   });
    //   return;
    // }

    // Get user's department for settings
    const user = await User.findByPk(userId);
    const isLate = await isLateArrival(now, user?.departmentId);

    // Create or update attendance record
    if (existing) {
      await existing.update({
        checkInTime: now,
        checkInLocation: location,
        status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        isLate,
      });

      res.status(200).json({
        status: 'success',
        message: `Checked in successfully${isLate ? ' (Late arrival)' : ''}`,
        data: { attendance: existing },
      });
    } else {
      const attendance = await Attendance.create({
        userId,
        date: now,
        checkInTime: now,
        checkInLocation: location,
        status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        isLate,
        workHours: 0,
        isEarlyDeparture: false,
      });

      res.status(201).json({
        status: 'success',
        message: `Checked in successfully${isLate ? ' (Late arrival)' : ''}`,
        data: { attendance },
      });
    }

    logger.info(`User ${userId} checked in at ${format(now, 'HH:mm:ss')}`);
  } catch (error) {
    logger.error('Check-in error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check in',
    });
  }
};

/**
 * Check out for the day
 * POST /api/attendance/check-out
 */
export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { location } = req.body;
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    if (!attendance) {
      res.status(400).json({
        status: 'error',
        message: 'You have not checked in today',
      });
      return;
    }

    // DEVELOPMENT MODE: Allow multiple check-outs for testing
    // if (attendance.checkOutTime) {
    //   res.status(400).json({
    //     status: 'error',
    //     message: 'You have already checked out today',
    //     data: { attendance },
    //   });
    //   return;
    // }

    // DEVELOPMENT MODE: Allow check-out without check-in for testing
    // if (!attendance.checkInTime) {
    //   res.status(400).json({
    //     status: 'error',
    //     message: 'Invalid attendance record - no check-in time found',
    //   });
    //   return;
    // }

    // Calculate work hours
    const workHours = attendance.checkInTime
      ? calculateWorkHours(attendance.checkInTime, now)
      : 0;

    // Check if early departure
    const user = await User.findByPk(userId);
    const isEarly = await isEarlyDeparture(now, user?.departmentId);

    // Get settings to determine half-day/full-day
    const settings = await getSettings(user?.departmentId);
    let status = attendance.status;

    if (settings) {
      if (workHours < settings.halfDayHours) {
        status = AttendanceStatus.HALF_DAY;
      } else if (workHours >= settings.fullDayHours) {
        status = AttendanceStatus.PRESENT;
      }
    }

    await attendance.update({
      checkOutTime: now,
      checkOutLocation: location,
      workHours,
      isEarlyDeparture: isEarly,
      status,
    });

    res.status(200).json({
      status: 'success',
      message: `Checked out successfully. Total work hours: ${workHours}${
        isEarly ? ' (Early departure)' : ''
      }`,
      data: { attendance },
    });

    logger.info(
      `User ${userId} checked out at ${format(now, 'HH:mm:ss')} - ${workHours} hours`
    );
  } catch (error) {
    logger.error('Check-out error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check out',
    });
  }
};

/**
 * Get today's attendance
 * GET /api/attendance/today
 */
export const getTodayAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = format(new Date(), 'yyyy-MM-dd');

    let attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    // If no attendance record, check status (weekend, holiday, leave, etc.)
    if (!attendance) {
      const status = await getAttendanceStatusForDate(userId, new Date());

      res.status(200).json({
        status: 'success',
        data: {
          attendance: null,
          statusReason: status,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    logger.error('Get today attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get today\'s attendance',
    });
  }
};

/**
 * Get my attendance records
 * GET /api/attendance/my
 */
export const getMyAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: endDate,
      };
    }

    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      status: 'success',
      data: {
        attendance,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get my attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get attendance records',
    });
  }
};

/**
 * Get team attendance (Manager/Admin)
 * GET /api/attendance/team
 */
export const getTeamAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // Get team members - admins see all users, managers see their direct reports
    const whereClause: any = { status: 'active' };
    if (userRole !== 'admin') {
      whereClause.managerId = userId;
    }

    const teamMembers = await User.findAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    const teamIds = teamMembers.map((m) => m.id);

    if (teamIds.length === 0) {
      res.status(200).json({
        status: 'success',
        data: { attendance: [] },
      });
      return;
    }

    // Get attendance for all team members
    const attendance = await Attendance.findAll({
      where: {
        userId: {
          [Op.in]: teamIds,
        },
        date: dateStr,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
        },
      ],
      order: [['checkInTime', 'ASC']],
    });

    // Add team members without attendance records
    const attendanceUserIds = attendance.map((a) => a.userId);
    const missingMembers = teamMembers.filter(
      (m) => !attendanceUserIds.includes(m.id)
    );

    const missingAttendance = await Promise.all(
      missingMembers.map(async (member) => {
        const status = await getAttendanceStatusForDate(member.id, targetDate);
        return {
          user: member,
          date: dateStr,
          status,
          userId: member.id,
          checkInTime: null,
          checkOutTime: null,
          workHours: 0,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        date: dateStr,
        attendance: [...attendance, ...missingAttendance],
      },
    });
  } catch (error) {
    logger.error('Get team attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get team attendance',
    });
  }
};

/**
 * Get monthly attendance summary
 * GET /api/attendance/monthly
 */
export const getMonthlyAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;

    const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const report = await generateMonthlyReport(userId, targetMonth, targetYear);

    res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    logger.error('Get monthly attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get monthly attendance',
    });
  }
};

/**
 * Export attendance report to CSV
 * GET /api/attendance/export
 */
export const exportAttendanceReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { startDate, endDate, status, userId: targetUserId } = req.query;

    const where: any = {};

    // If not admin/manager, can only export own data
    if (userRole === UserRole.EMPLOYEE) {
      where.userId = userId;
    } else if (targetUserId) {
      where.userId = targetUserId;
    } else if (userRole === UserRole.MANAGER) {
      // Get team members
      const teamMembers = await User.findAll({
        where: { managerId: userId },
        attributes: ['id'],
      });
      where.userId = {
        [Op.in]: [userId, ...teamMembers.map((m) => m.id)],
      };
    }

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    if (status) {
      where.status = status;
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['date', 'DESC']],
    });

    // Generate CSV
    const csvHeader =
      'Date,Employee Name,Email,Check In,Check Out,Work Hours,Status,Late,Early Departure,Location\n';

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

    const csvRows = attendance
      .map((record: any) => {
        const user = record.user;
        return [
          formatDate(record.date, 'yyyy-MM-dd'),
          `"${user?.firstName || ''} ${user?.lastName || ''}"`,
          user?.email || '-',
          formatDate(record.checkInTime, 'HH:mm:ss'),
          formatDate(record.checkOutTime, 'HH:mm:ss'),
          record.workHours || 0,
          record.status || '-',
          record.isLate ? 'Yes' : 'No',
          record.isEarlyDeparture ? 'Yes' : 'No',
          `"${record.checkInLocation || '-'}"`,
        ].join(',');
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    res.send(csv);

    logger.info(`Attendance report exported by user ${userId}`);
  } catch (error) {
    logger.error('Export attendance report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export attendance report',
    });
  }
};

/**
 * Request attendance regularization
 * POST /api/attendance/regularize
 */
export const requestRegularization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, requestedCheckIn, requestedCheckOut, reason, location } = req.body;

    // Validate date is not in future
    const targetDate = new Date(date);
    if (targetDate > new Date()) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot regularize attendance for future dates',
      });
      return;
    }

    // Check if already has pending regularization for this date
    const existing = await AttendanceRegularization.findOne({
      where: {
        userId,
        date,
        status: RegularizationStatus.PENDING,
      },
    });

    if (existing) {
      res.status(400).json({
        status: 'error',
        message: 'You already have a pending regularization request for this date',
      });
      return;
    }

    // Find attendance record
    const attendance = await Attendance.findOne({
      where: { userId, date },
    });

    // Create regularization request
    const regularization = await AttendanceRegularization.create({
      userId,
      attendanceId: attendance?.id,
      date: targetDate,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
      requestedLocation: location,
      reason,
      status: RegularizationStatus.PENDING,
    });

    // Get manager and send notification
    const user = await User.findByPk(userId);
    if (user?.managerId) {
      const manager = await User.findByPk(user.managerId);
      if (manager) {
        // Create in-app notification
        await createNotification({
          userId: manager.id,
          type: 'attendance',
          title: 'Attendance Regularization Request',
          message: `${user.firstName} ${user.lastName} has requested attendance regularization for ${format(targetDate, 'MMM dd, yyyy')}`,
          actionUrl: '/attendance',
          relatedId: regularization.id,
          relatedType: 'regularization',
        });

        // Send email notification
        if (manager.email) {
          await sendEmail({
            to: manager.email,
            subject: 'New Attendance Regularization Request',
            html: `
              <p>Dear ${manager.firstName},</p>
              <p><strong>${user.firstName} ${user.lastName}</strong> has requested attendance regularization for <strong>${format(targetDate, 'MMMM dd, yyyy')}</strong>.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>Please review and approve/reject this request from the Attendance Management system.</p>
              <p>Best regards,<br/>Operation Management System</p>
            `,
          });
        }
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Regularization request submitted successfully',
      data: { regularization },
    });

    logger.info(
      `User ${userId} requested attendance regularization for ${date}`
    );
  } catch (error) {
    logger.error('Request regularization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit regularization request',
    });
  }
};

/**
 * Get regularization requests
 * GET /api/attendance/regularizations
 */
export const getRegularizations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, page = 1, limit = 50 } = req.query;

    const where: any = {};
    const offset = (Number(page) - 1) * Number(limit);

    if (userRole === UserRole.EMPLOYEE) {
      // Employees can only see their own requests
      where.userId = userId;
    } else if (userRole === UserRole.MANAGER) {
      // Managers can see their team's requests
      const teamMembers = await User.findAll({
        where: { managerId: userId },
        attributes: ['id'],
      });
      where.userId = {
        [Op.in]: [userId, ...teamMembers.map((m) => m.id)],
      };
    }
    // Admins can see all requests (no filter)

    if (status) {
      where.status = status;
    }

    const { count, rows: regularizations } = await AttendanceRegularization.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      status: 'success',
      data: {
        regularizations,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get regularizations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get regularization requests',
    });
  }
};

/**
 * Approve regularization request
 * PUT /api/attendance/regularizations/:id/approve
 */
export const approveRegularization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const approverId = req.user!.id;
    const { comments } = req.body;

    const regularization = await AttendanceRegularization.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!regularization) {
      res.status(404).json({
        status: 'error',
        message: 'Regularization request not found',
      });
      return;
    }

    if (regularization.status !== RegularizationStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'This request has already been processed',
      });
      return;
    }

    // Update regularization
    await regularization.update({
      status: RegularizationStatus.APPROVED,
      approverId,
      approvedRejectedAt: new Date(),
      comments,
    });

    // Update or create attendance record
    const attendance = await Attendance.findOne({
      where: {
        userId: regularization.userId,
        date: regularization.date,
      },
    });

    const checkInTime = regularization.requestedCheckIn;
    const checkOutTime = regularization.requestedCheckOut;

    let workHours = 0;
    if (checkInTime && checkOutTime) {
      workHours = calculateWorkHours(checkInTime, checkOutTime);
    }

    if (attendance) {
      await attendance.update({
        checkInTime: checkInTime || attendance.checkInTime,
        checkOutTime: checkOutTime || attendance.checkOutTime,
        checkInLocation: regularization.requestedLocation || attendance.checkInLocation,
        checkOutLocation: regularization.requestedLocation || attendance.checkOutLocation,
        workHours,
        status: AttendanceStatus.PRESENT,
      });
    } else if (checkInTime) {
      await Attendance.create({
        userId: regularization.userId,
        date: regularization.date,
        checkInTime,
        checkOutTime,
        checkInLocation: regularization.requestedLocation,
        checkOutLocation: regularization.requestedLocation,
        workHours,
        status: AttendanceStatus.PRESENT,
        isLate: false,
        isEarlyDeparture: false,
        notes: 'Regularized',
      });
    }

    // Send notification to employee
    const user = regularization.user as any;
    if (user) {
      // Create in-app notification
      await createNotification({
        userId: user.id,
        type: 'attendance',
        title: 'Regularization Request Approved',
        message: `Your attendance regularization request for ${format(new Date(regularization.date), 'MMM dd, yyyy')} has been approved`,
        actionUrl: '/attendance',
        relatedId: regularization.id,
        relatedType: 'regularization',
      });

      // Send email notification
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Attendance Regularization Approved',
          html: `
            <p>Dear ${user.firstName},</p>
            <p>Your attendance regularization request for <strong>${format(new Date(regularization.date), 'MMMM dd, yyyy')}</strong> has been <strong>approved</strong>.</p>
            <p><strong>Manager's Comments:</strong> ${comments || 'No comments'}</p>
            <p>Best regards,<br/>Operation Management System</p>
          `,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Regularization request approved successfully',
      data: { regularization },
    });

    logger.info(
      `Regularization ${id} approved by user ${approverId}`
    );
  } catch (error) {
    logger.error('Approve regularization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve regularization request',
    });
  }
};

/**
 * Reject regularization request
 * PUT /api/attendance/regularizations/:id/reject
 */
export const rejectRegularization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const approverId = req.user!.id;
    const { comments } = req.body;

    const regularization = await AttendanceRegularization.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!regularization) {
      res.status(404).json({
        status: 'error',
        message: 'Regularization request not found',
      });
      return;
    }

    if (regularization.status !== RegularizationStatus.PENDING) {
      res.status(400).json({
        status: 'error',
        message: 'This request has already been processed',
      });
      return;
    }

    await regularization.update({
      status: RegularizationStatus.REJECTED,
      approverId,
      approvedRejectedAt: new Date(),
      comments: comments || 'Rejected',
    });

    // Send notification to employee
    const user = regularization.user as any;
    if (user) {
      // Create in-app notification
      await createNotification({
        userId: user.id,
        type: 'attendance',
        title: 'Regularization Request Rejected',
        message: `Your attendance regularization request for ${format(new Date(regularization.date), 'MMM dd, yyyy')} has been rejected`,
        actionUrl: '/attendance',
        relatedId: regularization.id,
        relatedType: 'regularization',
      });

      // Send email notification
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Attendance Regularization Rejected',
          html: `
            <p>Dear ${user.firstName},</p>
            <p>Your attendance regularization request for <strong>${format(new Date(regularization.date), 'MMMM dd, yyyy')}</strong> has been <strong>rejected</strong>.</p>
            <p><strong>Manager's Comments:</strong> ${comments || 'No reason provided'}</p>
            <p>If you have any questions, please contact your manager.</p>
            <p>Best regards,<br/>Operation Management System</p>
          `,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Regularization request rejected',
      data: { regularization },
    });

    logger.info(
      `Regularization ${id} rejected by user ${approverId}`
    );
  } catch (error) {
    logger.error('Reject regularization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject regularization request',
    });
  }
};

/**
 * Get attendance settings
 * GET /api/attendance/settings
 */
export const getAttendanceSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id);
    const settings = await getSettings(user?.departmentId);

    if (!settings) {
      res.status(404).json({
        status: 'error',
        message: 'Attendance settings not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { settings },
    });
  } catch (error) {
    logger.error('Get attendance settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get attendance settings',
    });
  }
};

/**
 * Update attendance settings (Admin only)
 * PUT /api/attendance/settings
 */
export const updateAttendanceSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId, ...updates } = req.body;

    let settings = await AttendanceSetting.findOne({
      where: { departmentId: departmentId || null },
    });

    if (settings) {
      await settings.update(updates);
    } else {
      settings = await AttendanceSetting.create({
        departmentId: departmentId || null,
        ...updates,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Attendance settings updated successfully',
      data: { settings },
    });

    logger.info(
      `Attendance settings updated for department ${departmentId || 'company-wide'} by user ${req.user!.id}`
    );
  } catch (error) {
    logger.error('Update attendance settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update attendance settings',
    });
  }
};
