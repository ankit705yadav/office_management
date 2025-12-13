import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, EmployeeSalaryDetail, Department } from '../models';
import logger from '../utils/logger';

/**
 * Create Salary Details for an Employee
 * POST /api/salary-details
 * Access: Admin only
 */
export const createSalaryDetails = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      employeeCode,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIfscCode,
      bankBranch,
      pfAccountNumber,
      uanNumber,
      esiNumber,
      basicSalary,
      hraPercentage,
      transportAllowance,
      otherAllowances,
      pfApplicable,
      esiApplicable,
      professionalTax,
      taxRegime,
    } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if salary details already exist for this user
    const existingDetails = await EmployeeSalaryDetail.findOne({
      where: { userId },
    });

    if (existingDetails) {
      return res.status(400).json({
        status: 'error',
        message: 'Salary details already exist for this employee. Use update instead.',
      });
    }

    // Create salary details
    const salaryDetails = await EmployeeSalaryDetail.create({
      userId,
      employeeCode,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIfscCode,
      bankBranch,
      pfAccountNumber,
      uanNumber,
      esiNumber,
      basicSalary,
      hraPercentage: hraPercentage || 40.0,
      transportAllowance: transportAllowance || 1600,
      otherAllowances: otherAllowances || 0,
      pfApplicable: pfApplicable !== undefined ? pfApplicable : true,
      esiApplicable: esiApplicable || false,
      professionalTax: professionalTax || 200,
      taxRegime: taxRegime || 'old',
    });

    logger.info(`Salary details created for user ${userId} by admin ${req.user?.id}`);

    return res.status(201).json({
      status: 'success',
      message: 'Salary details created successfully',
      data: salaryDetails,
    });
  } catch (error: any) {
    logger.error('Error creating salary details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create salary details',
      error: error.message,
    });
  }
};

/**
 * Get Salary Details by User ID
 * GET /api/salary-details/:userId
 * Access: Admin only (or employee can view their own)
 */
export const getSalaryDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Check authorization - admin can view all, employees can only view their own
    if (currentUser?.role !== 'admin' && currentUser?.id !== parseInt(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    const salaryDetails = await EmployeeSalaryDetail.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dateOfJoining', 'role', 'status', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!salaryDetails) {
      return res.status(404).json({
        status: 'error',
        message: 'Salary details not found for this employee',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: salaryDetails,
    });
  } catch (error: any) {
    logger.error('Error fetching salary details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch salary details',
      error: error.message,
    });
  }
};

/**
 * Get All Salary Details
 * GET /api/salary-details
 * Access: Admin only
 */
export const getAllSalaryDetails = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, department } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause for user filtering
    const userWhere: any = {};
    if (search) {
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeCode: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (department) {
      userWhere.department = department;
    }

    const { rows: salaryDetails, count } = await EmployeeSalaryDetail.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dateOfJoining', 'role', 'status', 'departmentId'],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      data: {
        salaryDetails,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching all salary details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch salary details',
      error: error.message,
    });
  }
};

/**
 * Update Salary Details
 * PUT /api/salary-details/:userId
 * Access: Admin only
 */
export const updateSalaryDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      employeeCode,
      panNumber,
      bankAccountNumber,
      bankName,
      bankIfscCode,
      bankBranch,
      pfAccountNumber,
      uanNumber,
      esiNumber,
      basicSalary,
      hraPercentage,
      transportAllowance,
      otherAllowances,
      pfApplicable,
      esiApplicable,
      professionalTax,
      taxRegime,
    } = req.body;

    const salaryDetails = await EmployeeSalaryDetail.findOne({
      where: { userId },
    });

    if (!salaryDetails) {
      return res.status(404).json({
        status: 'error',
        message: 'Salary details not found for this employee',
      });
    }

    // Update salary details
    await salaryDetails.update({
      employeeCode: employeeCode !== undefined ? employeeCode : salaryDetails.employeeCode,
      panNumber: panNumber !== undefined ? panNumber : salaryDetails.panNumber,
      bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : salaryDetails.bankAccountNumber,
      bankName: bankName !== undefined ? bankName : salaryDetails.bankName,
      bankIfscCode: bankIfscCode !== undefined ? bankIfscCode : salaryDetails.bankIfscCode,
      bankBranch: bankBranch !== undefined ? bankBranch : salaryDetails.bankBranch,
      pfAccountNumber: pfAccountNumber !== undefined ? pfAccountNumber : salaryDetails.pfAccountNumber,
      uanNumber: uanNumber !== undefined ? uanNumber : salaryDetails.uanNumber,
      esiNumber: esiNumber !== undefined ? esiNumber : salaryDetails.esiNumber,
      basicSalary: basicSalary !== undefined ? basicSalary : salaryDetails.basicSalary,
      hraPercentage: hraPercentage !== undefined ? hraPercentage : salaryDetails.hraPercentage,
      transportAllowance: transportAllowance !== undefined ? transportAllowance : salaryDetails.transportAllowance,
      otherAllowances: otherAllowances !== undefined ? otherAllowances : salaryDetails.otherAllowances,
      pfApplicable: pfApplicable !== undefined ? pfApplicable : salaryDetails.pfApplicable,
      esiApplicable: esiApplicable !== undefined ? esiApplicable : salaryDetails.esiApplicable,
      professionalTax: professionalTax !== undefined ? professionalTax : salaryDetails.professionalTax,
      taxRegime: taxRegime !== undefined ? taxRegime : salaryDetails.taxRegime,
    });

    logger.info(`Salary details updated for user ${userId} by admin ${req.user?.id}`);

    // Fetch updated details with user info
    const updatedDetails = await EmployeeSalaryDetail.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dateOfJoining', 'role', 'status', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Salary details updated successfully',
      data: updatedDetails,
    });
  } catch (error: any) {
    logger.error('Error updating salary details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update salary details',
      error: error.message,
    });
  }
};

/**
 * Delete Salary Details
 * DELETE /api/salary-details/:userId
 * Access: Admin only
 */
export const deleteSalaryDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const salaryDetails = await EmployeeSalaryDetail.findOne({
      where: { userId },
    });

    if (!salaryDetails) {
      return res.status(404).json({
        status: 'error',
        message: 'Salary details not found for this employee',
      });
    }

    // Delete salary details
    await salaryDetails.destroy();

    logger.info(`Salary details deleted for user ${userId} by admin ${req.user?.id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Salary details deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting salary details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete salary details',
      error: error.message,
    });
  }
};

/**
 * Get Employees Without Salary Setup
 * GET /api/salary-details/employees/without-salary
 * Access: Admin only
 */
export const getEmployeesWithoutSalary = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, department } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      status: 'active', // Only active employees
    };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (department) {
      where.department = department;
    }

    // Get all users who don't have salary details
    const { rows: users, count } = await User.findAndCountAll({
      where,
      include: [
        {
          model: EmployeeSalaryDetail,
          as: 'salaryDetails',
          required: false,
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dateOfJoining', 'role', 'status', 'departmentId'],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    // Filter out users who already have salary details
    const usersWithoutSalary = users.filter((user: any) => !user.salaryDetails);
    const totalWithoutSalary = usersWithoutSalary.length;

    return res.status(200).json({
      status: 'success',
      data: {
        employees: usersWithoutSalary,
        pagination: {
          total: totalWithoutSalary,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalWithoutSalary / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching employees without salary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch employees without salary',
      error: error.message,
    });
  }
};

/**
 * Bulk Import Salary Details
 * POST /api/salary-details/bulk-import
 * Access: Admin only
 */
export const bulkImportSalaryDetails = async (req: Request, res: Response) => {
  try {
    const { salaryData } = req.body; // Array of salary detail objects

    if (!Array.isArray(salaryData) || salaryData.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid salary data. Expected an array of salary details.',
      });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const data of salaryData) {
      try {
        const { userId, ...salaryFields } = data;

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
          results.failed.push({
            userId,
            reason: 'User not found',
          });
          continue;
        }

        // Check if salary details already exist
        const existing = await EmployeeSalaryDetail.findOne({
          where: { userId },
        });

        if (existing) {
          // Update existing
          await existing.update(salaryFields);
          results.success.push({
            userId,
            action: 'updated',
          });
        } else {
          // Create new
          await EmployeeSalaryDetail.create({
            userId,
            ...salaryFields,
          });
          results.success.push({
            userId,
            action: 'created',
          });
        }
      } catch (error: any) {
        results.failed.push({
          userId: data.userId,
          reason: error.message,
        });
      }
    }

    logger.info(`Bulk import completed by admin ${req.user?.id}: ${results.success.length} successful, ${results.failed.length} failed`);

    return res.status(200).json({
      status: 'success',
      message: `Bulk import completed: ${results.success.length} successful, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error: any) {
    logger.error('Error in bulk import:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to perform bulk import',
      error: error.message,
    });
  }
};
