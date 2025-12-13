import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { formatINR } from '../utils/payroll-calculator';
import logger from '../utils/logger';

interface PayrollData {
  id: number;
  userId: number;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
}

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  dateOfJoining: string;
}

interface SalaryDetails {
  panNumber?: string;
  pfAccountNumber?: string;
  uanNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
}

/**
 * Generate Payslip PDF
 * Creates a professional payslip PDF document
 */
export const generatePayslipPDF = async (
  payroll: PayrollData,
  user: UserData,
  salaryDetails?: SalaryDetails
): Promise<string> => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'payslips', String(payroll.year), String(payroll.month));
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate filename
    const filename = `payslip_${user.id}_${payroll.month}_${payroll.year}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add content to PDF
    addHeader(doc, payroll.month, payroll.year);
    addCompanyDetails(doc);
    addEmployeeDetails(doc, user, salaryDetails);
    addSalaryBreakdown(doc, payroll);
    addFooter(doc);

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    logger.info(`Payslip PDF generated: ${filepath}`);

    // Return relative path for storage in database
    return `/uploads/payslips/${payroll.year}/${payroll.month}/${filename}`;
  } catch (error) {
    logger.error('Error generating payslip PDF:', error);
    throw new Error('Failed to generate payslip PDF');
  }
};

/**
 * Add header to PDF
 */
function addHeader(doc: PDFKit.PDFDocument, month: number, year: number) {
  doc
    .fontSize(20)
    .fillColor('#1e2d3b')
    .text('ELISRUN TECHNOLOGIES', { align: 'center' })
    .fontSize(10)
    .fillColor('#666')
    .text('Operation Management System', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(16)
    .fillColor('#1e2d3b')
    .text('PAYSLIP', { align: 'center' })
    .fontSize(11)
    .fillColor('#666')
    .text(`For the month of ${getMonthName(month)} ${year}`, { align: 'center' })
    .moveDown(1.5);

  // Add a line
  doc
    .strokeColor('#1e2d3b')
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(1);
}

/**
 * Add company details
 */
function addCompanyDetails(doc: PDFKit.PDFDocument) {
  const startY = doc.y;

  doc
    .fontSize(10)
    .fillColor('#333')
    .text('Company Details:', 50, startY, { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(9)
    .fillColor('#666')
    .text('Elisrun Technologies Pvt Ltd', 50)
    .text('Bangalore, Karnataka, India')
    .text('PAN: AAECE1234F')
    .text('TAN: BLRE12345F')
    .moveDown(1);
}

/**
 * Add employee details
 */
function addEmployeeDetails(
  doc: PDFKit.PDFDocument,
  user: UserData,
  salaryDetails?: SalaryDetails
) {
  doc
    .fontSize(10)
    .fillColor('#333')
    .text('Employee Details:', { underline: true })
    .moveDown(0.5);

  const leftCol = 50;
  const rightCol = 300;
  let currentY = doc.y;

  // Left column
  doc
    .fontSize(9)
    .fillColor('#666')
    .text('Name:', leftCol, currentY)
    .fillColor('#333')
    .text(`${user.firstName} ${user.lastName}`, leftCol + 120, currentY);

  currentY += 15;
  doc
    .fillColor('#666')
    .text('Employee Code:', leftCol, currentY)
    .fillColor('#333')
    .text(user.employeeCode || 'N/A', leftCol + 120, currentY);

  currentY += 15;
  doc
    .fillColor('#666')
    .text('Email:', leftCol, currentY)
    .fillColor('#333')
    .text(user.email, leftCol + 120, currentY);

  currentY += 15;
  doc
    .fillColor('#666')
    .text('Date of Joining:', leftCol, currentY)
    .fillColor('#333')
    .text(format(new Date(user.dateOfJoining), 'dd MMM yyyy'), leftCol + 120, currentY);

  // Right column
  currentY = doc.y;
  if (salaryDetails?.panNumber) {
    doc
      .fillColor('#666')
      .text('PAN:', rightCol, currentY)
      .fillColor('#333')
      .text(salaryDetails.panNumber, rightCol + 120, currentY);
    currentY += 15;
  }

  if (salaryDetails?.uanNumber) {
    doc
      .fillColor('#666')
      .text('UAN:', rightCol, currentY)
      .fillColor('#333')
      .text(salaryDetails.uanNumber, rightCol + 120, currentY);
    currentY += 15;
  }

  if (salaryDetails?.bankAccountNumber) {
    doc
      .fillColor('#666')
      .text('Bank Account:', rightCol, currentY)
      .fillColor('#333')
      .text(salaryDetails.bankAccountNumber, rightCol + 120, currentY);
    currentY += 15;
  }

  doc.moveDown(2);
}

/**
 * Add salary breakdown table
 */
function addSalaryBreakdown(doc: PDFKit.PDFDocument, payroll: PayrollData) {
  const startY = doc.y;
  const col1 = 50;
  const col2 = 280;
  const col3 = 350;
  const col4 = 480;

  // Table header
  doc
    .rect(col1, startY, 495, 25)
    .fillAndStroke('#1e2d3b', '#1e2d3b');

  doc
    .fontSize(10)
    .fillColor('#fff')
    .text('EARNINGS', col1 + 10, startY + 8)
    .text('AMOUNT', col2 - 30, startY + 8)
    .text('DEDUCTIONS', col3 + 10, startY + 8)
    .text('AMOUNT', col4 - 30, startY + 8);

  let currentY = startY + 30;

  // Earnings and Deductions rows
  const earnings = [
    { label: 'Basic Salary', amount: payroll.basicSalary },
    { label: 'HRA', amount: payroll.hra },
    { label: 'Transport Allowance', amount: payroll.transportAllowance },
    { label: 'Other Allowances', amount: payroll.otherAllowances },
  ];

  const deductions = [
    { label: 'Provident Fund (PF)', amount: payroll.pfDeduction },
    { label: 'ESI', amount: payroll.esiDeduction },
    { label: 'Income Tax (TDS)', amount: payroll.taxDeduction },
    { label: 'Professional Tax', amount: payroll.otherDeductions },
  ];

  const maxRows = Math.max(earnings.length, deductions.length);

  for (let i = 0; i < maxRows; i++) {
    // Alternate row background
    if (i % 2 === 0) {
      doc.rect(col1, currentY - 5, 495, 20).fill('#f9f9f9');
    }

    // Earnings
    if (i < earnings.length) {
      doc
        .fontSize(9)
        .fillColor('#333')
        .text(earnings[i].label, col1 + 10, currentY)
        .text(formatINR(earnings[i].amount), col2 - 60, currentY, { width: 70, align: 'right' });
    }

    // Deductions
    if (i < deductions.length) {
      doc
        .fontSize(9)
        .fillColor('#333')
        .text(deductions[i].label, col3 + 10, currentY)
        .text(formatINR(deductions[i].amount), col4 - 60, currentY, { width: 70, align: 'right' });
    }

    currentY += 20;
  }

  // Totals row
  currentY += 5;
  doc
    .rect(col1, currentY, 495, 25)
    .fillAndStroke('#252a2e', '#252a2e');

  doc
    .fontSize(10)
    .fillColor('#fff')
    .text('GROSS SALARY', col1 + 10, currentY + 7)
    .text(formatINR(payroll.grossSalary), col2 - 60, currentY + 7, { width: 70, align: 'right' })
    .text('TOTAL DEDUCTIONS', col3 + 10, currentY + 7)
    .text(formatINR(payroll.totalDeductions), col4 - 60, currentY + 7, { width: 70, align: 'right' });

  // Net Salary
  currentY += 35;
  doc
    .rect(col1, currentY, 495, 30)
    .fillAndStroke('#10B981', '#10B981');

  doc
    .fontSize(12)
    .fillColor('#fff')
    .text('NET SALARY (Take Home)', col1 + 10, currentY + 9)
    .fontSize(14)
    .text(formatINR(payroll.netSalary), col4 - 80, currentY + 8, { width: 100, align: 'right' });

  doc.moveDown(2);
}

/**
 * Add footer
 */
function addFooter(doc: PDFKit.PDFDocument) {
  const bottomY = 750;

  doc
    .fontSize(8)
    .fillColor('#999')
    .text(
      'This is a system-generated payslip and does not require a signature.',
      50,
      bottomY,
      { align: 'center', width: 495 }
    )
    .text(
      `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      50,
      bottomY + 12,
      { align: 'center', width: 495 }
    );

  // Add page number
  doc.text(
    '© 2025 Elisrun Technologies. All rights reserved.',
    50,
    bottomY + 24,
    { align: 'center', width: 495 }
  );
}

/**
 * Get month name from month number
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

/**
 * Delete payslip PDF
 */
export const deletePayslipPDF = async (payslipUrl: string): Promise<void> => {
  try {
    const filepath = path.join(process.cwd(), payslipUrl);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`Payslip PDF deleted: ${filepath}`);
    }
  } catch (error) {
    logger.error('Error deleting payslip PDF:', error);
    // Don't throw error, just log it
  }
};
