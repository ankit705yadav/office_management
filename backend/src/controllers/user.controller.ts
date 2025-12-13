import { Request, Response } from 'express';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';
import { User, Department, LeaveBalance, EmployeeCustomField, EmployeeDocument } from '../models';
import { UserStatus } from '../types/enums';
import logger from '../utils/logger';

/**
 * Get all users (with pagination and filters)
 * GET /api/users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      departmentId,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build filter conditions
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching users',
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          association: 'leaveBalances',
          where: { year: new Date().getFullYear() },
          required: false,
        },
        { association: 'customFields' },
        { association: 'documents' },
      ],
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user',
    });
  }
};

/**
 * Create new user (Admin only)
 * POST /api/users
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      dateOfJoining,
      role,
      status,
      departmentId,
      managerId,
      address,
      emergencyContactName,
      emergencyContactPhone,
      panNumber,
      aadharNumber,
      customFields,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'Email already exists',
      });
      return;
    }

    // Get profile image URL from uploaded file
    let profileImageUrl: string | undefined;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.profileImage?.[0]) {
      profileImageUrl = `/uploads/profiles/${files.profileImage[0].filename}`;
    } else if (req.file) {
      profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    }

    // Create user
    const user = await User.create({
      email,
      passwordHash: password, // Will be hashed by beforeCreate hook
      firstName,
      lastName,
      phone,
      dateOfBirth,
      dateOfJoining,
      role: role || 'employee',
      status: status || 'active',
      departmentId,
      managerId,
      address,
      emergencyContactName,
      emergencyContactPhone,
      panNumber,
      aadharNumber,
      profileImageUrl,
    });

    // Create custom fields if provided
    if (customFields) {
      const parsedCustomFields = typeof customFields === 'string' ? JSON.parse(customFields) : customFields;
      for (const field of parsedCustomFields) {
        if (field.fieldName && field.fieldValue) {
          await EmployeeCustomField.create({
            userId: user.id,
            fieldName: field.fieldName,
            fieldValue: field.fieldValue,
          });
        }
      }
    }

    // Create employee documents from uploaded files
    if (files?.documents) {
      for (const file of files.documents) {
        await EmployeeDocument.create({
          userId: user.id,
          documentName: file.originalname,
          documentUrl: `/uploads/documents/${file.filename}`,
          documentType: file.mimetype,
        });
      }
    }

    // Create leave balance for current year
    const currentYear = new Date().getFullYear();
    await LeaveBalance.create({
      userId: user.id,
      year: currentYear,
      sickLeave: 12.0,
      casualLeave: 12.0,
      earnedLeave: 15.0,
      compOff: 0.0,
      paternityMaternity: 0.0,
    });

    logger.info(`New user created: ${user.email} by ${req.user?.email}`);

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'manager', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user: userResponse },
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating user',
    });
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      dateOfJoining,
      role,
      status,
      departmentId,
      managerId,
      address,
      emergencyContactName,
      emergencyContactPhone,
      profileImageUrl,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Update user fields
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : user.dateOfBirth,
      dateOfJoining: dateOfJoining || user.dateOfJoining,
      role: role || user.role,
      status: status || user.status,
      departmentId: departmentId !== undefined ? departmentId : user.departmentId,
      managerId: managerId !== undefined ? managerId : user.managerId,
      address: address !== undefined ? address : user.address,
      emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : user.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : user.emergencyContactPhone,
      profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : user.profileImageUrl,
    });

    logger.info(`User updated: ${user.email} by ${req.user?.email}`);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'manager', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating user',
    });
  }
};

/**
 * Delete user (soft delete by setting status to terminated)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Soft delete by setting status to terminated
    await user.update({ status: UserStatus.TERMINATED });

    logger.info(`User deleted (terminated): ${user.email} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting user',
    });
  }
};

/**
 * Get user's team (subordinates)
 * GET /api/users/:id/team
 */
export const getUserTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const team = await User.findAll({
      where: { managerId: id, status: 'active' },
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
      ],
      order: [['firstName', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: { team, count: team.length },
    });
  } catch (error) {
    logger.error('Get user team error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching team',
    });
  }
};

/**
 * Get all departments
 * GET /api/users/departments
 */
export const getAllDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await Department.findAll({
      include: [
        { association: 'head', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: { departments },
    });
  } catch (error) {
    logger.error('Get all departments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching departments',
    });
  }
};

/**
 * Generate employee ID card as PDF
 * GET /api/users/:id/id-card
 */
export const generateIdCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
      ],
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Generate employee code
    const employeeCode = `EMP${String(user.id).padStart(5, '0')}`;

    // Create PDF document
    const doc = new PDFDocument({
      size: [324, 204], // ID card size (3.375 x 2.125 inches at 96 DPI)
      margin: 10,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=id-card-${employeeCode}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Card background
    doc.rect(0, 0, 324, 204).fill('#ffffff');

    // Header with company name
    doc.rect(0, 0, 324, 50).fill('#3d9be9');
    doc.fillColor('#ffffff')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('COMPANY', 20, 15, { width: 284, align: 'center' });
    doc.fontSize(8)
       .font('Helvetica')
       .text('Operation Management', 20, 33, { width: 284, align: 'center' });

    // Employee photo placeholder
    doc.rect(20, 60, 70, 85).stroke('#cccccc');
    doc.fillColor('#999999')
       .fontSize(8)
       .text('PHOTO', 35, 95);

    // Employee details
    const detailsX = 100;
    let detailsY = 60;

    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(`${user.firstName} ${user.lastName}`, detailsX, detailsY);

    detailsY += 18;
    doc.fillColor('#666666')
       .fontSize(9)
       .font('Helvetica')
       .text(user.role.charAt(0).toUpperCase() + user.role.slice(1), detailsX, detailsY);

    detailsY += 15;
    doc.fillColor('#333333')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Employee ID:', detailsX, detailsY);
    doc.font('Helvetica')
       .text(employeeCode, detailsX + 65, detailsY);

    detailsY += 12;
    doc.font('Helvetica-Bold')
       .text('Department:', detailsX, detailsY);
    doc.font('Helvetica')
       .text((user as any).department?.name || 'N/A', detailsX + 65, detailsY);

    detailsY += 12;
    doc.font('Helvetica-Bold')
       .text('Date of Join:', detailsX, detailsY);
    doc.font('Helvetica')
       .text(user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString('en-IN') : 'N/A', detailsX + 65, detailsY);

    detailsY += 12;
    doc.font('Helvetica-Bold')
       .text('Contact:', detailsX, detailsY);
    doc.font('Helvetica')
       .text(user.phone || 'N/A', detailsX + 65, detailsY);

    // Footer
    doc.rect(0, 175, 324, 29).fill('#f1f5f9');
    doc.fillColor('#666666')
       .fontSize(7)
       .text('This card is the property of Company. If found, please return.', 20, 182, { width: 284, align: 'center' });
    doc.text(`Valid: ${new Date().getFullYear()}`, 20, 192, { width: 284, align: 'center' });

    // Finalize PDF
    doc.end();

    logger.info(`ID card generated for user ${id} by ${req.user?.email}`);
  } catch (error) {
    logger.error('Generate ID card error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating ID card',
    });
  }
};
