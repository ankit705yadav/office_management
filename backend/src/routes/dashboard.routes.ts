import { Router } from 'express';
import {
  getDashboardStats,
  getUpcomingBirthdays,
  getWorkAnniversaries,
  getRecentActivities,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getTeamCalendar,
  getEmployeesOnLeave,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (All authenticated users)
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/dashboard/birthdays
 * @desc    Get upcoming birthdays
 * @access  Private (All authenticated users)
 */
router.get('/birthdays', getUpcomingBirthdays);

/**
 * @route   GET /api/dashboard/anniversaries
 * @desc    Get work anniversaries
 * @access  Private (All authenticated users)
 */
router.get('/anniversaries', getWorkAnniversaries);

/**
 * @route   GET /api/dashboard/activities
 * @desc    Get recent activities (notifications)
 * @access  Private (All authenticated users)
 */
router.get('/activities', getRecentActivities);

/**
 * @route   PUT /api/dashboard/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (All authenticated users)
 */
router.put('/notifications/read-all', markAllNotificationsAsRead);

/**
 * @route   PUT /api/dashboard/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (All authenticated users)
 */
router.put('/notifications/:id/read', markNotificationAsRead);

/**
 * @route   GET /api/dashboard/team-calendar
 * @desc    Get team leave calendar
 * @access  Private (All authenticated users)
 */
router.get('/team-calendar', getTeamCalendar);

/**
 * @route   GET /api/dashboard/employees-on-leave
 * @desc    Get employees currently on leave or upcoming leave
 * @access  Private (Manager/Admin only - employees get empty array)
 */
router.get('/employees-on-leave', getEmployeesOnLeave);

export default router;
