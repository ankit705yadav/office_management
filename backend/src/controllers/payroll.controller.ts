import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Payroll from '../models/Payroll';
import User from '../models/User';
import EmployeeSalaryDetail from '../models/EmployeeSalaryDetail';
import { calculatePayroll } from '../utils/payroll-calculator';
import { generatePayslipPDF, deletePayslipPDF } from '../services/payslip.service';
import { sendPayslipEmail } from '../services/email.service';
import logger from '../utils/logger';

/**
 * Generate Payroll for Month/Year
 * Admin only
 * POST /api/payroll/generate
 */
export const generatePayroll = async (req: Request, res: Response) => {
  try {
    const { month, year, userIds, sendEmails = false } = req.body;
    const processedById = req.user?.id;

    logger.info(`Generating payroll for ${month}/${year} by user ${processedById}`);

    // Build where clause for users
    const userWhere: any = { status: 'active' };
    if (userIds && userIds.length > 0) {
      userWhere.id = { [Op.in]: userIds };
    }

    // Get all active users with salary details
    const users = await User.findAll({
      where: userWhere,
      include: [{
        model: EmployeeSalaryDetail,
        as: 'salaryDetails',
        required: true, // Only users with salary details
      }],
    });

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No eligible employees found with salary details',
      });
    }

    const results: {
      success: Array<{ userId: number; name: string; netSalary: number }>;
      failed: Array<{ userId: number; name: string; reason: string }>;
    } = {
      success: [],
      failed: [],
    };

    // Process each user
    for (const user of users) {
      let payroll: any = null;
      try {
        const salaryDetails = (user as any).salaryDetails;

        // Check if payroll already exists
        const existing = await Payroll.findOne({
          where: { userId: user.id, month, year },
        });

        if (existing) {
          results.failed.push({
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            reason: 'Payroll already exists for this month',
          });
          continue;
        }

        // Calculate payroll
        const payrollCalc = calculatePayroll({
          basicSalary: Number(salaryDetails.basicSalary),
          hraPercentage: Number(salaryDetails.hraPercentage),
          transportAllowance: Number(salaryDetails.transportAllowance),
          otherAllowances: Number(salaryDetails.otherAllowances),
          pfApplicable: salaryDetails.pfApplicable,
          esiApplicable: salaryDetails.esiApplicable,
          professionalTax: Number(salaryDetails.professionalTax),
          taxRegime: salaryDetails.taxRegime,
        });

        // Create payroll record
        payroll = await Payroll.create({
          userId: user.id,
          month,
          year,
          basicSalary: payrollCalc.basicSalary,
          hra: payrollCalc.hra,
          transportAllowance: payrollCalc.transportAllowance,
          otherAllowances: payrollCalc.otherAllowances,
          grossSalary: payrollCalc.grossSalary,
          pfDeduction: payrollCalc.pfDeduction,
          esiDeduction: payrollCalc.esiDeduction,
          taxDeduction: payrollCalc.taxDeduction,
          otherDeductions: payrollCalc.otherDeductions,
          totalDeductions: payrollCalc.totalDeductions,
          netSalary: payrollCalc.netSalary,
          processedBy: processedById,
          processedAt: new Date(),
        });

        // Generate PDF payslip
        const payslipUrl = await generatePayslipPDF(
          payroll.toJSON(),
          {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            employeeCode: salaryDetails.employeeCode,
            dateOfJoining: user.dateOfJoining instanceof Date
              ? user.dateOfJoining.toISOString()
              : user.dateOfJoining,
          },
          {
            panNumber: salaryDetails.panNumber,
            pfAccountNumber: salaryDetails.pfAccountNumber,
            uanNumber: salaryDetails.uanNumber,
            bankAccountNumber: salaryDetails.bankAccountNumber,
            bankName: salaryDetails.bankName,
            bankIfscCode: salaryDetails.bankIfscCode,
          }
        );

        // Update payroll with PDF URL
        await payroll.update({ payslipUrl });

        // Send email if requested
        if (sendEmails) {
          try {
            await sendPayslipEmail(user.firstName, user.email, month, year, payslipUrl);
          } catch (emailError) {
            logger.error(`Failed to send payslip email to ${user.email}:`, emailError);
            // Don't fail the whole process if email fails
          }
        }

        results.success.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          netSalary: payrollCalc.netSalary,
        });
      } catch (error) {
        logger.error(`Error processing payroll for user ${user.id}:`, error);

        // If payroll was created but PDF generation failed, delete the payroll record
        if (payroll) {
          try {
            await payroll.destroy();
            logger.info(`Rolled back payroll record for user ${user.id} due to error`);
          } catch (deleteError) {
            logger.error(`Failed to delete payroll record for user ${user.id}:`, deleteError);
          }
        }

        results.failed.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info(`Payroll generation complete: ${results.success.length} success, ${results.failed.length} failed`);

    return res.status(200).json({
      status: 'success',
      message: `Payroll generated for ${results.success.length} employees`,
      data: results,
    });
  } catch (error) {
    logger.error('Error generating payroll:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to generate payroll',
    });
  }
};

/**
 * Get Payroll Records
 * Role-based access: employees see own, managers see team, admins see all
 * GET /api/payroll
 */
export const getPayrollRecords = async (req: Request, res: Response) => {
  try {
    const { month, year, userId, page = 1, limit = 10 } = req.query;
    const currentUser = req.user;

    // Build where clause
    const where: any = {};

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    // Role-based filtering
    if (currentUser?.role === 'employee') {
      where.userId = currentUser.id; // Only own records
    } else if (currentUser?.role === 'manager') {
      // Get subordinates
      const subordinates = await User.findAll({
        where: { managerId: currentUser.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      where.userId = { [Op.in]: [...subordinateIds, currentUser.id] }; // Team + self
    }

    // Additional userId filter (admin/manager can filter by specific user)
    if (userId && currentUser?.role !== 'employee') {
      where.userId = Number(userId);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Payroll.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['year', 'DESC'], ['month', 'DESC'], ['created_at', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      data: {
        items: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching payroll records:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payroll records',
    });
  }
};

/**
 * Get My Payslips
 * GET /api/payroll/my-payslips
 */
export const getMyPayslips = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { year } = req.query;

    const where: any = { userId };
    if (year) where.year = Number(year);

    const payslips = await Payroll.findAll({
      where,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      data: payslips,
    });
  } catch (error) {
    logger.error('Error fetching my payslips:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payslips',
    });
  }
};

/**
 * Get Payroll by ID
 * GET /api/payroll/:id
 */
export const getPayrollById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const payroll = await Payroll.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfJoining'],
          include: [{
            model: EmployeeSalaryDetail,
            as: 'salaryDetails',
          }],
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!payroll) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll record not found',
      });
    }

    // Access control
    if (currentUser?.role === 'employee' && payroll.userId !== currentUser.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    if (currentUser?.role === 'manager') {
      const user = await User.findByPk(payroll.userId);
      if (user?.managerId !== currentUser.id && payroll.userId !== currentUser.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      data: payroll,
    });
  } catch (error) {
    logger.error('Error fetching payroll:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payroll details',
    });
  }
};

/**
 * Download Payslip PDF
 * GET /api/payroll/:id/download
 */
export const downloadPayslip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll record not found',
      });
    }

    // Access control (same as getPayrollById)
    if (currentUser?.role === 'employee' && payroll.userId !== currentUser.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    if (!payroll.payslipUrl) {
      return res.status(404).json({
        status: 'error',
        message: 'Payslip PDF not available',
      });
    }

    const path = require('path');
    const fs = require('fs');
    const filepath = path.join(process.cwd(), payroll.payslipUrl);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        status: 'error',
        message: 'Payslip PDF file not found',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payroll.month}_${payroll.year}.pdf`);

    const fileStream = fs.createReadStream(filepath);
    return fileStream.pipe(res);
  } catch (error) {
    logger.error('Error downloading payslip:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to download payslip',
    });
  }
};

/**
 * Update Payroll
 * Admin only
 * PUT /api/payroll/:id
 */
export const updatePayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll record not found',
      });
    }

    // Recalculate if salary components changed
    if (updates.basicSalary || updates.hra || updates.pfDeduction) {
      updates.grossSalary = Number(updates.basicSalary || payroll.basicSalary) +
        Number(updates.hra || payroll.hra) +
        Number(updates.transportAllowance || payroll.transportAllowance) +
        Number(updates.otherAllowances || payroll.otherAllowances);

      updates.totalDeductions = Number(updates.pfDeduction || payroll.pfDeduction) +
        Number(updates.esiDeduction || payroll.esiDeduction) +
        Number(updates.taxDeduction || payroll.taxDeduction) +
        Number(updates.otherDeductions || payroll.otherDeductions);

      updates.netSalary = updates.grossSalary - updates.totalDeductions;

      // Regenerate PDF
      const user = await User.findByPk(payroll.userId, {
        include: [{ model: EmployeeSalaryDetail, as: 'salaryDetails' }],
      });

      if (user) {
        // Delete old PDF
        if (payroll.payslipUrl) {
          await deletePayslipPDF(payroll.payslipUrl);
        }

        // Generate new PDF
        await payroll.update(updates);
        const userWithDetails = user as any;
        const payslipUrl = await generatePayslipPDF(
          payroll.toJSON(),
          {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            employeeCode: userWithDetails.salaryDetails?.employeeCode,
            dateOfJoining: user.dateOfJoining.toISOString(),
          },
          {
            panNumber: userWithDetails.salaryDetails?.panNumber,
            pfAccountNumber: userWithDetails.salaryDetails?.pfAccountNumber,
            uanNumber: userWithDetails.salaryDetails?.uanNumber,
            bankAccountNumber: userWithDetails.salaryDetails?.bankAccountNumber,
            bankName: userWithDetails.salaryDetails?.bankName,
            bankIfscCode: userWithDetails.salaryDetails?.bankIfscCode,
          }
        );
        updates.payslipUrl = payslipUrl;
      }
    }

    await payroll.update(updates);

    return res.status(200).json({
      status: 'success',
      message: 'Payroll updated successfully',
      data: payroll,
    });
  } catch (error) {
    logger.error('Error updating payroll:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update payroll',
    });
  }
};

/**
 * Delete Payroll
 * Admin only
 * DELETE /api/payroll/:id
 */
export const deletePayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByPk(id);

    if (!payroll) {
      return res.status(404).json({
        status: 'error',
        message: 'Payroll record not found',
      });
    }

    // Delete PDF file
    if (payroll.payslipUrl) {
      await deletePayslipPDF(payroll.payslipUrl);
    }

    await payroll.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Payroll deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting payroll:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete payroll',
    });
  }
};

/**
 * Get Payroll Summary
 * GET /api/payroll/summary
 */
export const getPayrollSummary = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const currentUser = req.user;

    const where: any = {};
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    // Role-based filtering
    if (currentUser?.role === 'employee') {
      where.userId = currentUser.id;
    } else if (currentUser?.role === 'manager') {
      const subordinates = await User.findAll({
        where: { managerId: currentUser.id },
        attributes: ['id'],
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      where.userId = { [Op.in]: [...subordinateIds, currentUser.id] };
    }

    const payrolls = await Payroll.findAll({ where });

    const summary = payrolls.reduce((acc, payroll) => ({
      totalGrossSalary: acc.totalGrossSalary + Number(payroll.grossSalary),
      totalDeductions: acc.totalDeductions + Number(payroll.totalDeductions),
      totalNetSalary: acc.totalNetSalary + Number(payroll.netSalary),
      employeesProcessed: acc.employeesProcessed + 1,
    }), {
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      employeesProcessed: 0,
    });

    return res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching payroll summary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payroll summary',
    });
  }
};
