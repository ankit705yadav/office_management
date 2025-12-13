import nodemailer, { Transporter } from 'nodemailer';
import config from '../config/environment';
import logger from '../utils/logger';

// Email configuration
const createTransporter = (): Transporter => {
  // For AWS SES in production
  if (config.nodeEnv === 'production' && config.aws.sesRegion) {
    return nodemailer.createTransport({
      host: `email-smtp.${config.aws.sesRegion}.amazonaws.com`,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.aws.accessKeyId,
        pass: config.aws.secretAccessKey,
      },
    });
  }

  // For development/testing - uses Ethereal Email (fake SMTP)
  // In production, you should use AWS SES or another email service
  if (config.nodeEnv === 'development') {
    // For testing, create a test account at ethereal.email
    // Or use Gmail SMTP with app password
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
      },
    });
  }

  // Fallback for local testing
  return nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
  });
};

const transporter = createTransporter();

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `${config.email.fromName} <${config.email.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent successfully to ${mailOptions.to}`, {
      messageId: info.messageId,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    logger.error('Email sending failed:', error);
    return false;
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  temporaryPassword: string
): Promise<boolean> => {
  const subject = 'Welcome to Elisrun Technologies';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Elisrun Technologies!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>

          <p>We're excited to welcome you to the Elisrun Technologies team! Your account has been created in our Operation Management System.</p>

          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>

          <p>Please login and change your password immediately for security purposes.</p>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/login" class="button">Login to Dashboard</a>
          </p>

          <p>If you have any questions or need assistance, please contact the IT department.</p>

          <p>Best regards,<br>Elisrun Technologies Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Elisrun Technologies. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Send leave request notification to manager
 */
export const sendLeaveRequestNotification = async (
  managerEmail: string,
  managerName: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  days: number,
  reason: string
): Promise<boolean> => {
  const subject = `New Leave Request from ${employeeName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .leave-details { background-color: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .button { display: inline-block; padding: 10px 20px; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .approve { background-color: #4CAF50; }
        .reject { background-color: #f44336; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Leave Request Pending Approval</h1>
        </div>
        <div class="content">
          <p>Dear ${managerName},</p>

          <p><strong>${employeeName}</strong> has submitted a leave request that requires your approval.</p>

          <div class="leave-details">
            <h3>Leave Details:</h3>
            <p><strong>Type:</strong> ${leaveType}</p>
            <p><strong>From:</strong> ${startDate}</p>
            <p><strong>To:</strong> ${endDate}</p>
            <p><strong>Duration:</strong> ${days} day(s)</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/leaves" class="button approve">Review Request</a>
          </p>

          <p>Please login to the system to approve or reject this request.</p>

          <p>Best regards,<br>Elisrun Technologies HR System</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: managerEmail, subject, html });
};

/**
 * Send leave approval notification to employee
 */
export const sendLeaveApprovalNotification = async (
  employeeEmail: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  days: number,
  approverName: string,
  comments?: string
): Promise<boolean> => {
  const subject = 'Leave Request Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .leave-details { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Leave Request Approved</h1>
        </div>
        <div class="content">
          <p>Dear ${employeeName},</p>

          <p>Good news! Your leave request has been <strong style="color: #4CAF50;">approved</strong> by ${approverName}.</p>

          <div class="leave-details">
            <h3>Approved Leave Details:</h3>
            <p><strong>Type:</strong> ${leaveType}</p>
            <p><strong>From:</strong> ${startDate}</p>
            <p><strong>To:</strong> ${endDate}</p>
            <p><strong>Duration:</strong> ${days} day(s)</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
          </div>

          <p>Enjoy your time off!</p>

          <p>Best regards,<br>Elisrun Technologies HR Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: employeeEmail, subject, html });
};

/**
 * Send leave rejection notification to employee
 */
export const sendLeaveRejectionNotification = async (
  employeeEmail: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  days: number,
  approverName: string,
  comments: string
): Promise<boolean> => {
  const subject = 'Leave Request Not Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .leave-details { background-color: #fff; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Leave Request Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${employeeName},</p>

          <p>Your leave request has been reviewed by ${approverName}. Unfortunately, it could not be approved at this time.</p>

          <div class="leave-details">
            <h3>Leave Request Details:</h3>
            <p><strong>Type:</strong> ${leaveType}</p>
            <p><strong>From:</strong> ${startDate}</p>
            <p><strong>To:</strong> ${endDate}</p>
            <p><strong>Duration:</strong> ${days} day(s)</p>
            <p><strong>Reason for Rejection:</strong> ${comments}</p>
          </div>

          <p>Please contact ${approverName} if you have any questions or would like to discuss alternative dates.</p>

          <p>Best regards,<br>Elisrun Technologies HR Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: employeeEmail, subject, html });
};

/**
 * Send birthday wishes
 */
export const sendBirthdayWishes = async (
  email: string,
  name: string
): Promise<boolean> => {
  const subject = '🎉 Happy Birthday!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #fff8e1; text-align: center; }
        .cake { font-size: 60px; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎂 Happy Birthday, ${name}! 🎂</h1>
        </div>
        <div class="content">
          <div class="cake">🎉 🎈 🎁</div>

          <h2>Wishing you a fantastic day!</h2>

          <p>On behalf of everyone at Elisrun Technologies, we wish you a very happy birthday filled with joy, laughter, and wonderful moments.</p>

          <p>Thank you for being a valued member of our team. We hope this year brings you success, happiness, and many more achievements!</p>

          <p style="margin-top: 30px;">Warmest wishes,<br><strong>The Elisrun Technologies Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elisrun Technologies. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Send work anniversary wishes
 */
export const sendWorkAnniversaryWishes = async (
  email: string,
  name: string,
  years: number
): Promise<boolean> => {
  const subject = `🎊 Happy ${years} Year Work Anniversary!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9C27B0; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f3e5f5; text-align: center; }
        .years { font-size: 48px; font-weight: bold; color: #9C27B0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎊 Congratulations, ${name}! 🎊</h1>
        </div>
        <div class="content">
          <p class="years">${years} ${years === 1 ? 'Year' : 'Years'}</p>

          <h2>Work Anniversary Celebration!</h2>

          <p>Today marks <strong>${years} ${years === 1 ? 'year' : 'years'}</strong> since you joined the Elisrun Technologies family!</p>

          <p>Your dedication, hard work, and valuable contributions have been instrumental to our success. We're grateful to have you as part of our team.</p>

          <p>Here's to many more years of growth, success, and achievements together!</p>

          <p style="margin-top: 30px;">With appreciation,<br><strong>The Elisrun Technologies Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elisrun Technologies. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>

          <p>We received a request to reset your password for your Elisrun Technologies account.</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>

          <p>Best regards,<br>Elisrun Technologies IT Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Send Payslip Email
 * @param firstName - Employee's first name
 * @param email - Employee's email
 * @param month - Payroll month
 * @param year - Payroll year
 * @param payslipPath - Path to payslip PDF (optional attachment)
 * @returns Promise<boolean>
 */
export const sendPayslipEmail = async (
  firstName: string,
  email: string,
  month: number,
  year: number,
  payslipPath?: string
): Promise<boolean> => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = months[month - 1];

  const subject = `Your Payslip for ${monthName} ${year}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e2d3b 0%, #252a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 30px; background: #1e2d3b; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #3d9be9; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Elisrun Technologies</h1>
            <p>Salary Slip Generated</p>
          </div>
          <div class="content">
            <p>Dear <strong>${firstName}</strong>,</p>

            <p>Your salary slip for <strong>${monthName} ${year}</strong> has been generated and is now available.</p>

            <div class="highlight">
              <h3 style="margin: 0;">Payslip for ${monthName} ${year}</h3>
            </div>

            <div class="info-box">
              <p><strong>Important:</strong></p>
              <ul>
                <li>Please review your payslip carefully</li>
                <li>Download and save the PDF for your records</li>
                <li>Contact HR if you have any questions or discrepancies</li>
              </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payroll" class="button">
                View Payslip
              </a>
            </p>

            <p>If you did not expect this email, please contact our HR department immediately.</p>

            <p>Best regards,<br>
            <strong>Elisrun Technologies HR Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Elisrun Technologies. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const emailOptions: any = {
    to: email,
    subject,
    html,
  };

  // Attach PDF if path is provided
  if (payslipPath) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const fullPath = path.join(process.cwd(), payslipPath);

      if (fs.existsSync(fullPath)) {
        emailOptions.attachments = [{
          filename: `Payslip_${monthName}_${year}.pdf`,
          path: fullPath,
        }];
      }
    } catch (error) {
      logger.error('Error attaching payslip PDF:', error);
      // Continue without attachment
    }
  }

  return sendEmail(emailOptions);
};

/**
 * Send asset assignment notification to employee
 */
export const sendAssetAssignmentEmail = async (
  employee: { email: string; firstName: string; lastName: string },
  asset: { name: string; assetTag: string },
  dueDate?: Date
): Promise<boolean> => {
  const subject = `Asset Assigned: ${asset.name}`;
  const formattedDueDate = dueDate ? dueDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .asset-details { background-color: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .due-date { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Asset Assigned</h1>
        </div>
        <div class="content">
          <p>Dear ${employee.firstName} ${employee.lastName},</p>

          <p>An asset has been assigned to you. Please take care of it${formattedDueDate ? ' and return it by the due date' : ''}.</p>

          <div class="asset-details">
            <h3>Asset Details:</h3>
            <p><strong>Item:</strong> ${asset.name}</p>
            <p><strong>Asset Tag:</strong> ${asset.assetTag}</p>
          </div>

          ${formattedDueDate ? `
          <div class="due-date">
            <h3>⏰ Due Date</h3>
            <p><strong>${formattedDueDate}</strong></p>
            <p>Please ensure the asset is returned by this date to avoid overdue notifications.</p>
          </div>
          ` : ''}

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/assets" class="button">View My Assets</a>
          </p>

          <p>If you have any questions, please contact your manager or HR.</p>

          <p>Best regards,<br>Elisrun Technologies Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Elisrun Technologies. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: employee.email, subject, html });
};

/**
 * Send asset due reminder (1 day before)
 */
export const sendAssetDueReminderEmail = async (
  employee: { email: string; firstName: string; lastName: string },
  asset: { name: string; assetTag: string },
  dueDate: Date
): Promise<boolean> => {
  const subject = `⏰ Reminder: ${asset.name} due tomorrow`;
  const formattedDueDate = dueDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fff8e1; }
        .asset-details { background-color: #fff; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Asset Due Tomorrow</h1>
        </div>
        <div class="content">
          <p>Dear ${employee.firstName} ${employee.lastName},</p>

          <p>This is a friendly reminder that the following asset is <strong>due tomorrow</strong>.</p>

          <div class="asset-details">
            <h3>Asset Details:</h3>
            <p><strong>Item:</strong> ${asset.name}</p>
            <p><strong>Asset Tag:</strong> ${asset.assetTag}</p>
            <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          </div>

          <p>Please ensure the asset is returned by the due date to avoid overdue notifications.</p>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/assets" class="button">View My Assets</a>
          </p>

          <p>Best regards,<br>Elisrun Technologies Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: employee.email, subject, html });
};

/**
 * Send asset due today notification
 */
export const sendAssetDueTodayEmail = async (
  employee: { email: string; firstName: string; lastName: string },
  asset: { name: string; assetTag: string }
): Promise<boolean> => {
  const subject = `⚠️ Asset Due Today: ${asset.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fff3e0; }
        .asset-details { background-color: #fff; padding: 15px; border-left: 4px solid #FF5722; margin: 20px 0; }
        .alert { background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Asset Due Today</h1>
        </div>
        <div class="content">
          <p>Dear ${employee.firstName} ${employee.lastName},</p>

          <p>The following asset is <strong>due today</strong>. Please return it as soon as possible.</p>

          <div class="asset-details">
            <h3>Asset Details:</h3>
            <p><strong>Item:</strong> ${asset.name}</p>
            <p><strong>Asset Tag:</strong> ${asset.assetTag}</p>
          </div>

          <div class="alert">
            <strong>Important:</strong> If not returned today, this item will be marked as overdue.
          </div>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/assets" class="button">Return Asset</a>
          </p>

          <p>Best regards,<br>Elisrun Technologies Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: employee.email, subject, html });
};

/**
 * Send asset overdue notification
 */
export const sendAssetOverdueEmail = async (
  employee: { email: string; firstName: string; lastName: string },
  asset: { name: string; assetTag: string },
  dueDate: Date,
  daysOverdue: number
): Promise<boolean> => {
  const subject = `🚨 OVERDUE: ${asset.name} - ${daysOverdue} days overdue`;
  const formattedDueDate = dueDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #ffebee; }
        .asset-details { background-color: #fff; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .overdue-badge { background-color: #f44336; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Asset Overdue</h1>
        </div>
        <div class="content">
          <p>Dear ${employee.firstName} ${employee.lastName},</p>

          <p style="text-align: center;">
            <span class="overdue-badge">${daysOverdue} DAYS OVERDUE</span>
          </p>

          <p>The following asset has not been returned and is now <strong>overdue</strong>.</p>

          <div class="asset-details">
            <h3>Asset Details:</h3>
            <p><strong>Item:</strong> ${asset.name}</p>
            <p><strong>Asset Tag:</strong> ${asset.assetTag}</p>
            <p><strong>Was Due:</strong> ${formattedDueDate}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
          </div>

          <p><strong>Please return this asset immediately.</strong> Continued delays may be escalated to your manager.</p>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/assets" class="button">Return Asset Now</a>
          </p>

          <p>If you have already returned this asset, please contact HR to update the records.</p>

          <p>Best regards,<br>Elisrun Technologies Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: employee.email, subject, html });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendLeaveRequestNotification,
  sendLeaveApprovalNotification,
  sendLeaveRejectionNotification,
  sendBirthdayWishes,
  sendWorkAnniversaryWishes,
  sendPasswordResetEmail,
  sendPayslipEmail,
  sendAssetAssignmentEmail,
  sendAssetDueReminderEmail,
  sendAssetDueTodayEmail,
  sendAssetOverdueEmail,
};
