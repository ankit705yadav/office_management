import { Router } from 'express';
import {
  createOrUpdateReport,
  submitReport,
  getMyReports,
  getTeamReports,
  getReportByDate,
  getReportById,
  deleteReport,
  getTeamMembers,
} from '../controllers/dailyReport.controller';
import { authenticate } from '../middleware/auth';
import { requireManagerOrAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/daily-reports/my
 * @desc    Get current user's daily reports
 * @access  Private (All authenticated users)
 */
router.get('/my', getMyReports);

/**
 * @route   GET /api/daily-reports/team
 * @desc    Get team's daily reports
 * @access  Private (Manager/Admin)
 */
router.get('/team', requireManagerOrAdmin, getTeamReports);

/**
 * @route   GET /api/daily-reports/team-members
 * @desc    Get team members list for filtering
 * @access  Private (Manager/Admin)
 */
router.get('/team-members', requireManagerOrAdmin, getTeamMembers);

/**
 * @route   GET /api/daily-reports/date/:date
 * @desc    Get report by date for current user
 * @access  Private (All authenticated users)
 */
router.get('/date/:date', getReportByDate);

/**
 * @route   GET /api/daily-reports/:id
 * @desc    Get report by ID
 * @access  Private (Owner, Manager of owner, or Admin)
 */
router.get('/:id', getReportById);

/**
 * @route   POST /api/daily-reports
 * @desc    Create or update daily report
 * @access  Private (All authenticated users)
 */
router.post('/', createOrUpdateReport);

/**
 * @route   POST /api/daily-reports/:id/submit
 * @desc    Submit a daily report
 * @access  Private (Owner only)
 */
router.post('/:id/submit', submitReport);

/**
 * @route   DELETE /api/daily-reports/:id
 * @desc    Delete a draft daily report
 * @access  Private (Owner only)
 */
router.delete('/:id', deleteReport);

export default router;
