import cron from 'node-cron';
import { Op } from 'sequelize';
import { User } from '../models';
import {
  sendBirthdayWishes,
  sendWorkAnniversaryWishes,
  sendAssetDueReminderEmail,
  sendAssetDueTodayEmail,
  sendAssetOverdueEmail,
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
 * Send asset due reminders (1 day before)
 * Runs daily at 9:00 AM
 */
const sendAssetDueTomorrowReminders = cron.schedule(
  '0 9 * * *', // Every day at 9:00 AM
  async () => {
    try {
      logger.info('Running asset due tomorrow reminders cron job...');

      const { AssetAssignment, Asset, Notification } = await import('../models');

      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Find assignments due tomorrow that haven't been reminded
      const assignments = await AssetAssignment.findAll({
        where: {
          status: 'assigned',
          dueDate: {
            [Op.between]: [tomorrow, tomorrowEnd],
          },
          reminderSentBefore: false,
        },
        include: [
          {
            model: Asset,
            as: 'asset',
            attributes: ['id', 'assetTag', 'name'],
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      logger.info(`Found ${assignments.length} asset(s) due tomorrow`);

      for (const assignment of assignments) {
        const assignee = (assignment as any).assignee;
        const asset = (assignment as any).asset;

        // Send email reminder
        if (assignment.dueDate) {
          await sendAssetDueReminderEmail(
            assignee,
            asset,
            assignment.dueDate
          );
        }

        // Create in-app notification
        await Notification.create({
          userId: assignment.assignedTo,
          type: 'asset',
          title: 'Asset Due Tomorrow',
          message: `${asset.name} (${asset.assetTag}) is due tomorrow. Please return it on time.`,
          actionUrl: '/assets',
        });

        // Mark reminder as sent
        await assignment.update({ reminderSentBefore: true });

        logger.info(`Due tomorrow reminder sent for assignment ${assignment.id}`);
      }

      logger.info('Asset due tomorrow reminders cron job completed');
    } catch (error) {
      logger.error('Asset due tomorrow reminders cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Send asset due today reminders
 * Runs daily at 9:05 AM
 */
const sendAssetDueTodayReminders = cron.schedule(
  '5 9 * * *', // Every day at 9:05 AM (5 minutes after tomorrow reminders)
  async () => {
    try {
      logger.info('Running asset due today reminders cron job...');

      const { AssetAssignment, Asset, Notification } = await import('../models');

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Find assignments due today that haven't been reminded
      const assignments = await AssetAssignment.findAll({
        where: {
          status: 'assigned',
          dueDate: {
            [Op.between]: [today, todayEnd],
          },
          reminderSentDue: false,
        },
        include: [
          {
            model: Asset,
            as: 'asset',
            attributes: ['id', 'assetTag', 'name'],
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      logger.info(`Found ${assignments.length} asset(s) due today`);

      for (const assignment of assignments) {
        const assignee = (assignment as any).assignee;
        const asset = (assignment as any).asset;

        // Send email reminder
        await sendAssetDueTodayEmail(
          assignee,
          asset
        );

        // Create in-app notification
        await Notification.create({
          userId: assignment.assignedTo,
          type: 'asset',
          title: 'Asset Due Today',
          message: `${asset.name} (${asset.assetTag}) is due today. Please return it to avoid overdue notices.`,
          actionUrl: '/assets',
        });

        // Mark reminder as sent
        await assignment.update({ reminderSentDue: true });

        logger.info(`Due today reminder sent for assignment ${assignment.id}`);
      }

      logger.info('Asset due today reminders cron job completed');
    } catch (error) {
      logger.error('Asset due today reminders cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Kolkata',
  }
);

/**
 * Mark overdue assets and send reminders
 * Runs daily at 10:00 AM
 */
const processOverdueAssets = cron.schedule(
  '0 10 * * *', // Every day at 10:00 AM
  async () => {
    try {
      logger.info('Running overdue assets cron job...');

      const { AssetAssignment, Asset, Notification } = await import('../models');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find assigned items that are now overdue and mark them
      const newlyOverdue = await AssetAssignment.findAll({
        where: {
          status: 'assigned',
          dueDate: {
            [Op.lt]: today,
            [Op.ne]: null as any,
          },
        } as any,
      });

      // Mark as overdue
      for (const assignment of newlyOverdue) {
        await assignment.update({ status: 'overdue' });
        logger.info(`Assignment ${assignment.id} marked as overdue`);
      }

      // Now process all overdue items for reminders (every 2 days)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const overdueAssignments = await AssetAssignment.findAll({
        where: {
          status: 'overdue',
          [Op.or]: [
            { lastOverdueReminder: null as any },
            { lastOverdueReminder: { [Op.lt]: twoDaysAgo } },
          ],
        } as any,
        include: [
          {
            model: Asset,
            as: 'asset',
            attributes: ['id', 'assetTag', 'name'],
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      logger.info(`Found ${overdueAssignments.length} overdue asset(s) needing reminders`);

      for (const assignment of overdueAssignments) {
        const assignee = (assignment as any).assignee;
        const asset = (assignment as any).asset;

        if (!assignment.dueDate) continue;

        // Calculate days overdue
        const dueDate = new Date(assignment.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Send overdue email
        await sendAssetOverdueEmail(
          assignee,
          asset,
          dueDate,
          daysOverdue
        );

        // Create in-app notification
        await Notification.create({
          userId: assignment.assignedTo,
          type: 'asset',
          title: 'Asset Overdue',
          message: `${asset.name} (${asset.assetTag}) is ${daysOverdue} days overdue. Please return it immediately.`,
          actionUrl: '/assets',
        });

        // Update last reminder timestamp
        await assignment.update({ lastOverdueReminder: new Date() });

        logger.info(`Overdue reminder sent for assignment ${assignment.id} (${daysOverdue} days overdue)`);
      }

      logger.info('Overdue assets cron job completed');
    } catch (error) {
      logger.error('Overdue assets cron job failed:', error);
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

  sendAssetDueTomorrowReminders.start();
  logger.info('✓ Asset due tomorrow reminders cron job started (Daily at 9:00 AM)');

  sendAssetDueTodayReminders.start();
  logger.info('✓ Asset due today reminders cron job started (Daily at 9:05 AM)');

  processOverdueAssets.start();
  logger.info('✓ Overdue assets cron job started (Daily at 10:00 AM)');

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
  sendAssetDueTomorrowReminders.stop();
  sendAssetDueTodayReminders.stop();
  processOverdueAssets.stop();

  logger.info('All cron jobs stopped');
};

export default {
  startCronJobs,
  stopCronJobs,
};
