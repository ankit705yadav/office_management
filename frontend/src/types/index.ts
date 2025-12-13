// User-related types
export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  role: UserRole;
  status: UserStatus;
  departmentId?: number;
  managerId?: number;
  profileImageUrl?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  department?: Department;
  manager?: Partial<User>;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  headId?: number;
}

// Auth-related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// Leave-related types
export enum LeaveType {
  SICK = 'sick_leave',
  CASUAL = 'casual_leave',
  EARNED = 'earned_leave',
  COMP_OFF = 'comp_off',
  PATERNITY = 'paternity_maternity',
  MATERNITY = 'paternity_maternity',
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum HalfDaySession {
  FIRST_HALF = 'first_half',
  SECOND_HALF = 'second_half',
}

export interface LeaveBalance {
  id: number;
  userId: number;
  year: number;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  compOff: number;
  paternityMaternity: number;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface LeaveApproval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approvalOrder: number;
  status: ApprovalStatus;
  comments?: string;
  actedAt?: string;
  createdAt: string;
  updatedAt: string;
  approver?: Partial<User> & { role?: string };
}

export interface LeaveRequest {
  id: number;
  userId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: RequestStatus;
  approverId?: number;
  approvedRejectedAt?: string;
  comments?: string;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
  documentUrl?: string;
  currentApprovalLevel?: number;
  totalApprovalLevels?: number;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  approver?: Partial<User>;
  approvals?: LeaveApproval[];
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
  halfDaySession?: HalfDaySession;
}

// Holiday-related types
export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
  isOptional: boolean;
  year: number;
}

// Dashboard-related types
export interface DashboardStats {
  user: {
    leaveBalance: LeaveBalance;
  };
  leaves: {
    pending: number;
  };
  notifications: {
    unread: number;
  };
  approvals?: {
    pending: number;
  };
  admin?: {
    totalEmployees: number;
    monthlyExpenses: number;
  };
}

export interface Birthday {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  profileImageUrl?: string;
  department?: Department;
}

export interface WorkAnniversary extends Birthday {
  dateOfJoining: string;
  yearsOfService: number;
}

export interface EmployeeOnLeave {
  id: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profileImageUrl?: string;
    department?: Department;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  isCurrentlyOnLeave: boolean;
}

// Notification-related types
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form types
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Payroll-related types
export interface Payroll {
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
  payslipUrl?: string;
  processedBy?: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  processor?: Partial<User>;
}

export interface EmployeeSalaryDetail {
  id: number;
  userId: number;
  employeeCode?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  bankBranch?: string;
  pfAccountNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  basicSalary: number;
  hraPercentage: number;
  transportAllowance: number;
  otherAllowances: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  professionalTax: number;
  taxRegime: 'old' | 'new';
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
}

export interface GeneratePayrollRequest {
  month: number;
  year: number;
  userIds?: number[];
  sendEmails?: boolean;
}

export interface CreateSalaryDetailRequest {
  userId: number;
  employeeCode?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  bankBranch?: string;
  pfAccountNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  basicSalary: number;
  hraPercentage?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  pfApplicable?: boolean;
  esiApplicable?: boolean;
  professionalTax?: number;
  taxRegime?: 'old' | 'new';
}

export interface PayrollSummary {
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  employeeCount: number;
}

// Expense-related types
export enum ExpenseCategory {
  TRAVEL = 'travel',
  FOOD = 'food',
  ACCOMMODATION = 'accommodation',
  OFFICE_SUPPLIES = 'office_supplies',
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  TRAINING = 'training',
  OTHER = 'other',
}

export interface Expense {
  id: number;
  userId: number;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
  status: RequestStatus;
  approverId?: number;
  approvedRejectedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  approver?: Partial<User>;
}

export interface CreateExpenseRequest {
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
}

export interface ExpenseSummary {
  totalPending: number;
  totalApproved: number;
  monthlyTotal: number;
  pendingCount: number;
  approvedCount: number;
}

// Voucher-related types
export interface Voucher {
  id: number;
  voucherNumber: string;
  name: string;
  amount: number;
  region: string;
  qrCodeData: string;
  description?: string;
  createdBy: number;
  expenseId?: number;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
  creator?: Partial<User>;
  expense?: Partial<Expense>;
}

export interface CreateVoucherRequest {
  name: string;
  amount: number;
  region: string;
  description?: string;
  expenseId?: number;
}

// Advance Salary Request types
export enum AdvanceSalaryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  CANCELLED = 'cancelled',
}

export interface AdvanceSalaryRequest {
  id: number;
  userId: number;
  amount: number;
  reason: string;
  requestedForMonth: number;
  requestedForYear: number;
  status: AdvanceSalaryStatus;
  approverId?: number;
  approvedRejectedAt?: string;
  comments?: string;
  disbursedBy?: number;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  approver?: Partial<User>;
  disburser?: Partial<User>;
}

export interface CreateAdvanceSalaryRequest {
  amount: number;
  reason: string;
  requestedForMonth: number;
  requestedForYear: number;
}

export interface AdvanceSalarySummary {
  totalPending: number;
  totalApproved: number;
  totalDisbursed: number;
  pendingCount: number;
  approvedCount: number;
  disbursedCount: number;
}
