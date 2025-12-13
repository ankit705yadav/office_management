/**
 * Payroll Calculator Utility
 * Contains functions to calculate various components of employee salary
 */

interface SalaryComponents {
  basicSalary: number;
  hraPercentage: number;
  transportAllowance: number;
  otherAllowances: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  professionalTax: number;
  taxRegime: string;
}

interface PayrollCalculation {
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

/**
 * Calculate HRA (House Rent Allowance)
 * @param basicSalary - Employee's basic salary
 * @param hraPercentage - HRA percentage (default 40%)
 * @returns Calculated HRA amount
 */
export const calculateHRA = (basicSalary: number, hraPercentage: number = 40): number => {
  return Number(((basicSalary * hraPercentage) / 100).toFixed(2));
};

/**
 * Calculate PF (Provident Fund) Deduction
 * Employee contribution: 12% of basic salary
 * Maximum basic salary for PF calculation: ₹15,000
 * @param basicSalary - Employee's basic salary
 * @param pfApplicable - Whether PF is applicable
 * @returns Calculated PF deduction
 */
export const calculatePF = (basicSalary: number, pfApplicable: boolean = true): number => {
  if (!pfApplicable) return 0;

  // PF is calculated on basic salary capped at ₹15,000
  const pfBase = Math.min(basicSalary, 15000);
  return Number((pfBase * 0.12).toFixed(2));
};

/**
 * Calculate ESI (Employee State Insurance) Deduction
 * Employee contribution: 0.75% of gross salary
 * Applicable only if gross salary is less than ₹21,000 per month
 * @param grossSalary - Employee's gross salary
 * @param esiApplicable - Whether ESI is applicable
 * @returns Calculated ESI deduction
 */
export const calculateESI = (grossSalary: number, esiApplicable: boolean = false): number => {
  if (!esiApplicable || grossSalary >= 21000) return 0;

  return Number((grossSalary * 0.0075).toFixed(2));
};

/**
 * Calculate Gross Salary
 * Gross = Basic + HRA + Transport Allowance + Other Allowances
 * @param basicSalary - Employee's basic salary
 * @param hra - HRA amount
 * @param transportAllowance - Transport allowance
 * @param otherAllowances - Other allowances
 * @returns Calculated gross salary
 */
export const calculateGrossSalary = (
  basicSalary: number,
  hra: number,
  transportAllowance: number,
  otherAllowances: number
): number => {
  return Number((basicSalary + hra + transportAllowance + otherAllowances).toFixed(2));
};

/**
 * Calculate Income Tax (Simplified)
 * This is a basic implementation. In production, use detailed tax slabs
 * based on the financial year and tax regime (old/new)
 *
 * Old Regime Tax Slabs (FY 2024-25):
 * - Up to ₹2.5L: Nil
 * - ₹2.5L - ₹5L: 5%
 * - ₹5L - ₹10L: 20%
 * - Above ₹10L: 30%
 *
 * New Regime Tax Slabs (FY 2024-25):
 * - Up to ₹3L: Nil
 * - ₹3L - ₹6L: 5%
 * - ₹6L - ₹9L: 10%
 * - ₹9L - ₹12L: 15%
 * - ₹12L - ₹15L: 20%
 * - Above ₹15L: 30%
 *
 * @param annualIncome - Annual taxable income
 * @param taxRegime - Tax regime ('old' or 'new')
 * @returns Monthly tax deduction
 */
export const calculateIncomeTax = (annualIncome: number, taxRegime: string = 'old'): number => {
  let tax = 0;

  if (taxRegime === 'new') {
    // New Tax Regime (without deductions)
    if (annualIncome <= 300000) {
      tax = 0;
    } else if (annualIncome <= 600000) {
      tax = (annualIncome - 300000) * 0.05;
    } else if (annualIncome <= 900000) {
      tax = 15000 + (annualIncome - 600000) * 0.10;
    } else if (annualIncome <= 1200000) {
      tax = 45000 + (annualIncome - 900000) * 0.15;
    } else if (annualIncome <= 1500000) {
      tax = 90000 + (annualIncome - 1200000) * 0.20;
    } else {
      tax = 150000 + (annualIncome - 1500000) * 0.30;
    }
  } else {
    // Old Tax Regime (with standard deduction)
    // Assuming ₹50,000 standard deduction
    const taxableIncome = Math.max(0, annualIncome - 50000);

    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.20;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.30;
    }
  }

  // Add 4% cess on tax
  tax = tax * 1.04;

  // Return monthly deduction
  return Number((tax / 12).toFixed(2));
};

/**
 * Calculate Total Deductions
 * @param pfDeduction - PF deduction
 * @param esiDeduction - ESI deduction
 * @param taxDeduction - Tax deduction
 * @param professionalTax - Professional tax
 * @param otherDeductions - Other deductions
 * @returns Total deductions
 */
export const calculateTotalDeductions = (
  pfDeduction: number,
  esiDeduction: number,
  taxDeduction: number,
  professionalTax: number,
  otherDeductions: number = 0
): number => {
  return Number((pfDeduction + esiDeduction + taxDeduction + professionalTax + otherDeductions).toFixed(2));
};

/**
 * Calculate Net Salary
 * Net Salary = Gross Salary - Total Deductions
 * @param grossSalary - Gross salary
 * @param totalDeductions - Total deductions
 * @returns Net salary (take-home pay)
 */
export const calculateNetSalary = (grossSalary: number, totalDeductions: number): number => {
  return Number((grossSalary - totalDeductions).toFixed(2));
};

/**
 * Main function to calculate complete payroll
 * @param salaryComponents - Employee's salary components
 * @returns Complete payroll calculation
 */
export const calculatePayroll = (salaryComponents: SalaryComponents): PayrollCalculation => {
  const {
    basicSalary,
    hraPercentage,
    transportAllowance,
    otherAllowances,
    pfApplicable,
    esiApplicable,
    professionalTax,
    taxRegime,
  } = salaryComponents;

  // Calculate earnings
  const hra = calculateHRA(basicSalary, hraPercentage);
  const grossSalary = calculateGrossSalary(basicSalary, hra, transportAllowance, otherAllowances);

  // Calculate deductions
  const pfDeduction = calculatePF(basicSalary, pfApplicable);
  const esiDeduction = calculateESI(grossSalary, esiApplicable);

  // Calculate annual income for tax
  const annualGrossSalary = grossSalary * 12;
  const annualPF = pfDeduction * 12;
  // For simplicity, assuming HRA exemption is 40% of HRA
  const hraExemption = hra * 12 * 0.4;
  const annualTaxableIncome = annualGrossSalary - annualPF - hraExemption;

  const taxDeduction = calculateIncomeTax(annualTaxableIncome, taxRegime);

  const totalDeductions = calculateTotalDeductions(
    pfDeduction,
    esiDeduction,
    taxDeduction,
    professionalTax
  );

  const netSalary = calculateNetSalary(grossSalary, totalDeductions);

  return {
    basicSalary,
    hra,
    transportAllowance,
    otherAllowances,
    grossSalary,
    pfDeduction,
    esiDeduction,
    taxDeduction,
    otherDeductions: professionalTax, // Professional tax is included here
    totalDeductions,
    netSalary,
  };
};

/**
 * Format currency for Indian Rupees
 * @param amount - Amount to format
 * @returns Formatted string
 */
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};
