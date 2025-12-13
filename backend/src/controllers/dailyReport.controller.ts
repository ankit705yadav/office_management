import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { DailyReport, DailyReportEntry, User, Project, Task } from '../models';
import { DailyReportStatus } from '../models/DailyReport';
import { UserRole } from '../types/enums';
import logger from '../utils/logger';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';

const MAX_BACKDATE_DAYS = 7;

/**
 * Create or update a daily report
 * POST /api/daily-reports
 */
export const createOrUpdateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { reportDate, summary, entries } = req.body;

    // Validate report date
    const parsedDate = parseISO(reportDate);
    const today = startOfDay(new Date());
    const daysDiff = differenceInDays(today, parsedDate);

    if (daysDiff < 0) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot create report for future dates',
      });
      return;
    }

    if (daysDiff > MAX_BACKDATE_DAYS) {
      res.status(400).json({
        status: 'error',
        message: `Cannot create report older than ${MAX_BACKDATE_DAYS} days`,
      });
      return;
    }

    // Check if report already exists
    let report = await DailyReport.findOne({
      where: { userId, reportDate: parsedDate },
    });

    // If report exists and is submitted, don't allow editing
    if (report && report.status === DailyReportStatus.SUBMITTED) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot edit a submitted report',
      });
      return;
    }

    // Calculate total hours
    const totalHours = entries?.reduce((sum: number, entry: any) => sum + Number(entry.hours || 0), 0) || 0;

    if (report) {
      // Update existing report
      await report.update({ summary, totalHours });

      // Delete existing entries and create new ones
      await DailyReportEntry.destroy({ where: { dailyReportId: report.id } });
    } else {
      // Create new report
      report = await DailyReport.create({
        userId,
        reportDate: parsedDate,
        summary,
        totalHours,
        status: DailyReportStatus.DRAFT,
      });
    }

    // Create entries
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        await DailyReportEntry.create({
          dailyReportId: report.id,
          projectId: entry.projectId || null,
          taskId: entry.taskId || null,
          description: entry.description,
          hours: entry.hours,
        });
      }
    }

    // Reload with associations
    const updatedReport = await DailyReport.findByPk(report.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: DailyReportEntry,
          as: 'entries',
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
            { model: Task, as: 'task', attributes: ['id', 'title', 'taskCode'] },
          ],
        },
      ],
    });

    res.status(201).json({
      status: 'success',
      data: updatedReport,
    });
  } catch (error) {
    logger.error('Error creating/updating daily report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save daily report',
    });
  }
};

/**
 * Submit a daily report
 * POST /api/daily-reports/:id/submit
 */
export const submitReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const report = await DailyReport.findByPk(id, {
      include: [{ model: DailyReportEntry, as: 'entries' }],
    });

    if (!report) {
      res.status(404).json({
        status: 'error',
        message: 'Report not found',
      });
      return;
    }

    if (report.userId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'You can only submit your own reports',
      });
      return;
    }

    if (report.status === DailyReportStatus.SUBMITTED) {
      res.status(400).json({
        status: 'error',
        message: 'Report is already submitted',
      });
      return;
    }

    // Validate report has entries
    if (!report.entries || report.entries.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot submit empty report. Add at least one entry.',
      });
      return;
    }

    await report.update({
      status: DailyReportStatus.SUBMITTED,
      submittedAt: new Date(),
    });

    res.json({
      status: 'success',
      message: 'Report submitted successfully',
      data: report,
    });
  } catch (error) {
    logger.error('Error submitting daily report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit report',
    });
  }
};

/**
 * Get current user's reports
 * GET /api/daily-reports/my
 */
export const getMyReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.reportDate = {
        [Op.between]: [parseISO(startDate as string), parseISO(endDate as string)],
      };
    } else if (startDate) {
      where.reportDate = { [Op.gte]: parseISO(startDate as string) };
    } else if (endDate) {
      where.reportDate = { [Op.lte]: parseISO(endDate as string) };
    }

    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reports } = await DailyReport.findAndCountAll({
      where,
      include: [
        {
          model: DailyReportEntry,
          as: 'entries',
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
            { model: Task, as: 'task', attributes: ['id', 'title', 'taskCode'] },
          ],
        },
      ],
      order: [['reportDate', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      status: 'success',
      data: {
        reports,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching my reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reports',
    });
  }
};

/**
 * Get team reports (managers and admins only)
 * GET /api/daily-reports/team
 */
export const getTeamReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { startDate, endDate, status, employeeId, page = 1, limit = 20 } = req.query;

    // Only managers and admins can view team reports
    if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'Only managers and admins can view team reports',
      });
      return;
    }

    const where: any = {};

    // For managers, only show reports from their direct reports
    if (userRole === UserRole.MANAGER) {
      const subordinates = await User.findAll({
        where: { managerId: userId, status: 'active' },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      where.userId = { [Op.in]: subordinateIds };
    }

    // Filter by specific employee if provided
    if (employeeId) {
      where.userId = Number(employeeId);
    }

    if (startDate && endDate) {
      where.reportDate = {
        [Op.between]: [parseISO(startDate as string), parseISO(endDate as string)],
      };
    } else if (startDate) {
      where.reportDate = { [Op.gte]: parseISO(startDate as string) };
    } else if (endDate) {
      where.reportDate = { [Op.lte]: parseISO(endDate as string) };
    }

    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reports } = await DailyReport.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: DailyReportEntry,
          as: 'entries',
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
            { model: Task, as: 'task', attributes: ['id', 'title', 'taskCode'] },
          ],
        },
      ],
      order: [['reportDate', 'DESC'], ['userId', 'ASC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      status: 'success',
      data: {
        reports,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching team reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch team reports',
    });
  }
};

/**
 * Get report by date for current user
 * GET /api/daily-reports/date/:date
 */
export const getReportByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const parsedDate = parseISO(date);

    const report = await DailyReport.findOne({
      where: { userId, reportDate: parsedDate },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: DailyReportEntry,
          as: 'entries',
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
            { model: Task, as: 'task', attributes: ['id', 'title', 'taskCode'] },
          ],
        },
      ],
    });

    res.json({
      status: 'success',
      data: report || null,
    });
  } catch (error) {
    logger.error('Error fetching report by date:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report',
    });
  }
};

/**
 * Get report by ID
 * GET /api/daily-reports/:id
 */
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    const report = await DailyReport.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'managerId'] },
        {
          model: DailyReportEntry,
          as: 'entries',
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
            { model: Task, as: 'task', attributes: ['id', 'title', 'taskCode'] },
          ],
        },
      ],
    });

    if (!report) {
      res.status(404).json({
        status: 'error',
        message: 'Report not found',
      });
      return;
    }

    // Check permission: owner, manager of owner, or admin
    const isOwner = report.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;
    const isManager = userRole === UserRole.MANAGER && (report.user as any)?.managerId === userId;

    if (!isOwner && !isAdmin && !isManager) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this report',
      });
      return;
    }

    res.json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    logger.error('Error fetching report by ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report',
    });
  }
};

/**
 * Delete a draft report
 * DELETE /api/daily-reports/:id
 */
export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const report = await DailyReport.findByPk(id);

    if (!report) {
      res.status(404).json({
        status: 'error',
        message: 'Report not found',
      });
      return;
    }

    if (report.userId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'You can only delete your own reports',
      });
      return;
    }

    if (report.status === DailyReportStatus.SUBMITTED) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot delete a submitted report',
      });
      return;
    }

    await report.destroy();

    res.json({
      status: 'success',
      message: 'Report deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting daily report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete report',
    });
  }
};

/**
 * Get team members for managers/admins
 * GET /api/daily-reports/team-members
 */
export const getTeamMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'Only managers and admins can view team members',
      });
      return;
    }

    let where: any = { status: 'active' };

    // Managers can only see their direct reports
    if (userRole === UserRole.MANAGER) {
      where.managerId = userId;
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    res.json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    logger.error('Error fetching team members:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch team members',
    });
  }
};
