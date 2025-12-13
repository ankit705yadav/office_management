import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { User, LeaveRequest, Expense, Holiday, Notification, LeaveBalance } from '../models';
import { RequestStatus } from '../types/enums';
import logger from '../utils/logger';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Get dashboard stats
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Common stats for all users
    const stats: any = {
      user: {},
      leaves: {},
      notifications: {},
    };

    // User's leave balance
    const leaveBalance = await LeaveBalance.findOne({
      where: { userId, year: currentYear },
    });

    stats.user.leaveBalance = leaveBalance;

    // User's pending leave requests
    const pendingLeaves = await LeaveRequest.count({
      where: { userId, status: RequestStatus.PENDING },
    });

    stats.leaves.pending = pendingLeaves;

    // User's approved leave requests this month
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const approvedLeaves = await LeaveRequest.count({
      where: {
        userId,
        status: RequestStatus.APPROVED,
        startDate: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    stats.leaves.approved = approvedLeaves;

    // User's unread notifications
    const unreadNotifications = await Notification.count({
      where: { userId, isRead: false },
    });

    stats.notifications.unread = unreadNotifications;

    // Manager/Admin specific stats
    if (userRole === 'manager' || userRole === 'admin') {
      // Pending approvals (leave requests)
      let pendingApprovals = 0;

      if (userRole === 'admin') {
        pendingApprovals = await LeaveRequest.count({
          where: { status: RequestStatus.PENDING },
        });
      } else {
        // Get manager's subordinates
        const subordinates = await User.findAll({
          where: { managerId: userId },
          attributes: ['id'],
        });
        const subordinateIds = subordinates.map((s) => s.id);

        pendingApprovals = await LeaveRequest.count({
          where: {
            userId: { [Op.in]: subordinateIds },
            status: RequestStatus.PENDING,
          },
        });
      }

      stats.approvals = {
        pending: pendingApprovals,
      };
    }

    // Admin specific stats
    if (userRole === 'admin') {
      // Total active employees
      const totalEmployees = await User.count({
        where: { status: 'active' },
      });

      stats.admin = {
        totalEmployees,
      };

      // Total expenses this month
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const monthlyExpenses = await Expense.sum('amount', {
        where: {
          expenseDate: {
            [Op.between]: [startDate, endDate],
          },
          status: RequestStatus.APPROVED,
        },
      });

      stats.admin.monthlyExpenses = monthlyExpenses || 0;
    }

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching dashboard stats',
    });
  }
};

/**
 * Get upcoming birthdays
 * GET /api/dashboard/birthdays
 */
export const getUpcomingBirthdays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const currentMonth = new Date().getMonth() + 1;
    const currentDate = new Date().getDate();

    // Get users with birthdays this month
    const birthdays = await User.findAll({
      where: {
        status: 'active',
        dateOfBirth: {
          [Op.ne]: null as any,
        },
      } as any,
      attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'profileImageUrl'],
      include: [
        { association: 'department', attributes: ['id', 'name'] },
      ],
      limit: Number(limit),
    });

    // Filter and sort by upcoming birthdays
    const upcomingBirthdays = birthdays
      .filter((user) => {
        if (!user.dateOfBirth) return false;
        const birthMonth = new Date(user.dateOfBirth).getMonth() + 1;
        const birthDate = new Date(user.dateOfBirth).getDate();

        // Same month and date is today or in future
        return birthMonth === currentMonth && birthDate >= currentDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateOfBirth!).getDate();
        const dateB = new Date(b.dateOfBirth!).getDate();
        return dateA - dateB;
      })
      .slice(0, Number(limit));

    res.status(200).json({
      status: 'success',
      data: { birthdays: upcomingBirthdays },
    });
  } catch (error) {
    logger.error('Get upcoming birthdays error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching birthdays',
    });
  }
};

/**
 * Get work anniversaries (this month)
 * GET /api/dashboard/anniversaries
 */
export const getWorkAnniversaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get users with joining date in this month
    const users = await User.findAll({
      where: {
        status: 'active',
        dateOfJoining: {
          [Op.ne]: null as any,
        },
      } as any,
      attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfJoining', 'profileImageUrl'],
      include: [
        { association: 'department', attributes: ['id', 'name'] },
      ],
    });

    // Filter for this month's anniversaries and calculate years
    const anniversaries = users
      .filter((user) => {
        const joiningMonth = new Date(user.dateOfJoining).getMonth() + 1;
        const joiningYear = new Date(user.dateOfJoining).getFullYear();
        return joiningMonth === currentMonth && joiningYear < currentYear;
      })
      .map((user) => {
        const yearsOfService = currentYear - new Date(user.dateOfJoining).getFullYear();
        return {
          ...user.toJSON(),
          yearsOfService,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateOfJoining!).getDate();
        const dateB = new Date(b.dateOfJoining!).getDate();
        return dateA - dateB;
      })
      .slice(0, Number(limit));

    res.status(200).json({
      status: 'success',
      data: { anniversaries },
    });
  } catch (error) {
    logger.error('Get work anniversaries error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching work anniversaries',
    });
  }
};

/**
 * Get recent activities (notifications)
 * GET /api/dashboard/activities
 */
export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;

    const notifications = await Notification.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
    });

    res.status(200).json({
      status: 'success',
      data: { activities: notifications },
    });
  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching recent activities',
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/dashboard/notifications/:id/read
 */
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
      return;
    }

    await notification.update({ isRead: true });

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while marking notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/dashboard/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while marking notifications as read',
    });
  }
};

/**
 * Get employees currently on leave
 * GET /api/dashboard/employees-on-leave
 * - Employee: sees nothing
 * - Manager: sees their team members on leave
 * - Admin: sees all employees and managers on leave
 */
export const getEmployeesOnLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Get leaves that are current (today is between start and end date) or upcoming (within next 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysStr = format(thirtyDaysLater, 'yyyy-MM-dd');

    let userFilter: any = {};

    // Employees don't see this widget
    if (userRole === 'employee') {
      res.status(200).json({
        status: 'success',
        data: { employeesOnLeave: [] },
      });
      return;
    }

    // Managers see their team members
    if (userRole === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);

      if (subordinateIds.length === 0) {
        res.status(200).json({
          status: 'success',
          data: { employeesOnLeave: [] },
        });
        return;
      }

      userFilter = { [Op.in]: subordinateIds };
    }
    // Admin sees all (no filter needed)

    const whereClause: any = {
      status: RequestStatus.APPROVED,
      [Op.or]: [
        // Currently on leave
        {
          startDate: { [Op.lte]: todayStr },
          endDate: { [Op.gte]: todayStr },
        },
        // Upcoming leave within 30 days
        {
          startDate: {
            [Op.gt]: todayStr,
            [Op.lte]: thirtyDaysStr,
          },
        },
      ],
    };

    if (userRole === 'manager') {
      whereClause.userId = userFilter;
    }

    const leaves = await LeaveRequest.findAll({
      where: whereClause,
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profileImageUrl'],
          include: [
            { association: 'department', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['startDate', 'ASC']],
    });

    // Group by current/upcoming and format response
    const employeesOnLeave = leaves.map((leave) => {
      const isCurrentlyOnLeave = new Date(leave.startDate) <= today && new Date(leave.endDate) >= today;
      return {
        id: leave.id,
        employee: (leave as any).user,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        daysCount: leave.daysCount,
        reason: leave.reason,
        isCurrentlyOnLeave,
      };
    });

    res.status(200).json({
      status: 'success',
      data: { employeesOnLeave },
    });
  } catch (error) {
    logger.error('Get employees on leave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching employees on leave',
    });
  }
};

/**
 * Get team calendar (leave schedule)
 * GET /api/dashboard/team-calendar
 */
export const getTeamCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { startDate, endDate } = req.query;

    let whereClause: any = {
      status: RequestStatus.APPROVED,
    };

    if (startDate && endDate) {
      whereClause.startDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Employees see only their own leaves
    if (userRole === 'employee') {
      whereClause.userId = userId;
    } else if (userRole === 'manager') {
      // Managers see their team's leaves
      const subordinates = await User.findAll({
        where: { managerId: userId },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      subordinateIds.push(userId); // Include manager's own leaves

      whereClause.userId = { [Op.in]: subordinateIds };
    }
    // Admin sees all leaves (no additional filter)

    const leaves = await LeaveRequest.findAll({
      where: whereClause,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['startDate', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: { leaves },
    });
  } catch (error) {
    logger.error('Get team calendar error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching team calendar',
    });
  }
};
