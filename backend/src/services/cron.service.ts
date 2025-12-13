import cron from 'node-cron';
import { Op } from 'sequelize';
import { User } from '../models';
import {
  sendBirthdayWishes,
  sendWorkAnniversaryWishes,
} from './email.service';
import {
  autoMarkLeaveAsAttendance,
  autoMarkAbsent,
} from './attendance.service';
import logger from '../utils/logger';
import config from '../config/environment';

/**
 * Send birthday wishes to employees
 * Runs daily at 9:00 AM
 */
const sendBirthdayNotifications = cron.schedule(
  '0 9 * * *', // Every day at 9:00 AM
  async () => {
    try {
      logger.info('Running birthday notification cron job...');

      const today = new Date();
      const month = today.getMonth() + 1; // JavaScript months are 0-indexed
      const date = today.getDate();

      // Find users with birthday today
      const users = await User.findAll({
        where: {
          status: 'active',
          dateOfBirth: {
            [Op.ne]: null as any,
          },
        } as any,
      });

      const birthdayUsers = users.filter((user) => {
        if (!user.dateOfBirth) return false;
        const birthDate = new Date(user.dateOfBirth);
        return birthDate.getMonth() + 1 === month && birthDate.getDate() === date;
      });

      logger.info(`Found ${birthdayUsers.length} birthday(s) today`);

      // Send birthday wishes
      for (const user of birthdayUsers) {
        await sendBirthdayWishes(user.email, user.fullName);
        logger.info(`Birthday wishes sent to ${user.email}`);
      }

      logger.info('Birthday notification cron job completed');
    } catch (error) {
      logger.error('Birthday notification cron job failed:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
    timezone: 'Asia/Kolkata', // Set your timezone
  }
);

/**
 * Send work anniversary wishes to employees
 * Runs daily at 9:00 AM
 */
const sendAnniversaryNotifications = cron.schedule(
  '0 9 * * *', // Every day at 9:00 AM
  async () => {
    try {
      logger.info('Running work anniversary notification cron job...');

      const today = new Date();
      const currentYear = today.getFullYear();
      const month = today.getMonth() + 1;
      const date = today.getDate();

      // Find users with work anniversary today
      const users = await User.findAll({
        where: {
          status: 'active',
          dateOfJoining: {
            [Op.ne]: null as any,
          },
        } as any,
      });

      const anniversaryUsers = users.filter((user) => {
        const joiningDate = new Date(user.dateOfJoining);
        const joiningYear = joiningDate.getFullYear();

        // Check if anniversary is today and they've been here at least 1 year
        return (
          joiningYear < currentYear &&
          joiningDate.getMonth() + 1 === month &&
          joiningDate.getDate() === date
        );
      });

      logger.info(`Found ${anniversaryUsers.length} work anniversary/anniversaries today`);

      // Send anniversary wishes
      for (const user of anniversaryUsers) {
        const joiningDate = new Date(user.dateOfJoining);
        const yearsOfService = currentYear - joiningDate.getFullYear();

        await sendWorkAnniversaryWishes(user.email, user.fullName, yearsOfService);
        logger.info(`Anniversary wishes sent to ${user.email} (${yearsOfService} years)`);
      }

      logger.info('Work anniversary notification cron job completed');
    } catch (error) {
      logger.error('Work anniversary notification cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Clean up old notifications
 * Runs weekly on Sunday at 2:00 AM
 */
const cleanupOldNotifications = cron.schedule(
  '0 2 * * 0', // Every Sunday at 2:00 AM
  async () => {
    try {
      logger.info('Running notification cleanup cron job...');

      const { Notification } = await import('../models');

      // Delete read notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await Notification.destroy({
        where: {
          isRead: true,
          createdAt: {
            [Op.lt]: thirtyDaysAgo,
          },
        },
      });

      logger.info(`Cleaned up ${deletedCount} old notifications`);
    } catch (error) {
      logger.error('Notification cleanup cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Send reminder for pending leave approvals
 * Runs daily at 10:00 AM
 */
const sendPendingApprovalReminders = cron.schedule(
  '0 10 * * *', // Every day at 10:00 AM
  async () => {
    try {
      logger.info('Running pending approval reminders cron job...');

      const { LeaveRequest } = await import('../models');

      // Find leave requests pending for more than 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const pendingLeaves = await LeaveRequest.findAll({
        where: {
          status: 'pending',
          createdAt: {
            [Op.lt]: twoDaysAgo,
          },
        },
        include: [
          { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'managerId'] },
        ],
      });

      logger.info(`Found ${pendingLeaves.length} pending leave request(s) older than 2 days`);

      // Group by manager and send reminders
      const managerLeaves = new Map<number, any[]>();

      for (const leave of pendingLeaves) {
        const managerId = (leave as any).user.managerId;
        if (managerId) {
          if (!managerLeaves.has(managerId)) {
            managerLeaves.set(managerId, []);
          }
          managerLeaves.get(managerId)!.push(leave);
        }
      }

      // Send reminder emails to managers
      for (const [managerId, leaves] of managerLeaves) {
        const manager = await User.findByPk(managerId);
        if (manager) {
          // Here you would send a reminder email
          logger.info(`Reminder: Manager ${manager.email} has ${leaves.length} pending approval(s)`);
          // TODO: Implement reminder email template
        }
      }

      logger.info('Pending approval reminders cron job completed');
    } catch (error) {
      logger.error('Pending approval reminders cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Auto-mark attendance for users on approved leave
 * Runs daily at 1:00 AM
 */
const autoMarkLeaveAttendance = cron.schedule(
  '0 1 * * *', // Every day at 1:00 AM
  async () => {
    try {
      logger.info('Running auto-mark leave attendance cron job...');
      await autoMarkLeaveAsAttendance();
      logger.info('Auto-mark leave attendance cron job completed');
    } catch (error) {
      logger.error('Auto-mark leave attendance cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Auto-mark absent for users who didn't check in
 * Runs daily at 11:59 PM
 */
const autoMarkAbsentUsers = cron.schedule(
  '59 23 * * *', // Every day at 11:59 PM
  async () => {
    try {
      logger.info('Running auto-mark absent cron job...');
      await autoMarkAbsent();
      logger.info('Auto-mark absent cron job completed');
    } catch (error) {
      logger.error('Auto-mark absent cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Initialize and start all cron jobs
 */
export const startCronJobs = (): void => {
  if (!config.enableCronJobs) {
    logger.info('Cron jobs are disabled in configuration');
    return;
  }

  logger.info('Starting cron jobs...');

  sendBirthdayNotifications.start();
  logger.info('✓ Birthday notifications cron job started (Daily at 9:00 AM)');

  sendAnniversaryNotifications.start();
  logger.info('✓ Work anniversary notifications cron job started (Daily at 9:00 AM)');

  cleanupOldNotifications.start();
  logger.info('✓ Notification cleanup cron job started (Weekly on Sunday at 2:00 AM)');

  sendPendingApprovalReminders.start();
  logger.info('✓ Pending approval reminders cron job started (Daily at 10:00 AM)');

  autoMarkLeaveAttendance.start();
  logger.info('✓ Auto-mark leave attendance cron job started (Daily at 1:00 AM)');

  autoMarkAbsentUsers.start();
  logger.info('✓ Auto-mark absent users cron job started (Daily at 11:59 PM)');

  logger.info('All cron jobs started successfully');
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = (): void => {
  logger.info('Stopping cron jobs...');

  sendBirthdayNotifications.stop();
  sendAnniversaryNotifications.stop();
  cleanupOldNotifications.stop();
  sendPendingApprovalReminders.stop();
  autoMarkLeaveAttendance.stop();
  autoMarkAbsentUsers.stop();

  logger.info('All cron jobs stopped');
};

export default {
  startCronJobs,
  stopCronJobs,
};
