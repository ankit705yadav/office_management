import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for login
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

/**
 * Validation rules for user registration/creation
 */
export const createUserValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('dateOfJoining')
    .notEmpty()
    .withMessage('Date of joining is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('role')
    .optional()
    .isIn(['employee', 'manager', 'admin'])
    .withMessage('Invalid role'),
  body('departmentId')
    .optional()
    .isInt()
    .withMessage('Department ID must be a number'),
];

/**
 * Validation rules for password change
 */
export const changePasswordValidation: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

/**
 * Validation rules for leave request
 */
export const leaveRequestValidation: ValidationChain[] = [
  body('leaveType')
    .isIn(['sick_leave', 'casual_leave', 'earned_leave', 'comp_off', 'paternity_maternity'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => new Date(value) >= new Date(req.body.startDate))
    .withMessage('End date must be after or equal to start date'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
];

/**
 * Validation rules for expense claim
 */
export const expenseValidation: ValidationChain[] = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .isIn(['travel', 'food', 'accommodation', 'office_supplies', 'software', 'hardware', 'training', 'other'])
    .withMessage('Invalid expense category'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('expenseDate')
    .isISO8601()
    .withMessage('Please provide a valid expense date'),
];

/**
 * Validation rules for payroll generation
 */
export const generatePayrollValidation: ValidationChain[] = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Please provide a valid year'),
  body('userIds')
    .optional()
    .isArray()
    .withMessage('User IDs must be an array'),
  body('userIds.*')
    .optional()
    .isInt()
    .withMessage('Each user ID must be a number'),
  body('sendEmails')
    .optional()
    .isBoolean()
    .withMessage('sendEmails must be a boolean'),
];

/**
 * Validation rules for creating salary details
 */
export const createSalaryDetailsValidation: ValidationChain[] = [
  body('userId')
    .isInt()
    .withMessage('User ID is required and must be a number'),
  body('basicSalary')
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),
  body('hraPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('HRA percentage must be between 0 and 100'),
  body('transportAllowance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport allowance must be a positive number'),
  body('otherAllowances')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other allowances must be a positive number'),
  body('professionalTax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Professional tax must be a positive number'),
  body('pfApplicable')
    .optional()
    .isBoolean()
    .withMessage('PF applicable must be a boolean'),
  body('esiApplicable')
    .optional()
    .isBoolean()
    .withMessage('ESI applicable must be a boolean'),
  body('taxRegime')
    .optional()
    .isIn(['old', 'new'])
    .withMessage('Tax regime must be either "old" or "new"'),
  body('panNumber')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format (e.g., ABCDE1234F)'),
  body('bankIfscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  body('uanNumber')
    .optional()
    .isLength({ min: 12, max: 12 })
    .withMessage('UAN number must be 12 digits'),
];

/**
 * Validation rules for updating salary details
 */
export const updateSalaryDetailsValidation: ValidationChain[] = [
  body('basicSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),
  body('hraPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('HRA percentage must be between 0 and 100'),
  body('transportAllowance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport allowance must be a positive number'),
  body('otherAllowances')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other allowances must be a positive number'),
  body('professionalTax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Professional tax must be a positive number'),
  body('pfApplicable')
    .optional()
    .isBoolean()
    .withMessage('PF applicable must be a boolean'),
  body('esiApplicable')
    .optional()
    .isBoolean()
    .withMessage('ESI applicable must be a boolean'),
  body('taxRegime')
    .optional()
    .isIn(['old', 'new'])
    .withMessage('Tax regime must be either "old" or "new"'),
  body('panNumber')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format (e.g., ABCDE1234F)'),
  body('bankIfscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  body('uanNumber')
    .optional()
    .isLength({ min: 12, max: 12 })
    .withMessage('UAN number must be 12 digits'),
];
