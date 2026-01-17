// TypeScript interfaces matching backend models

import {
  UserRole,
  UserStatus,
  LeaveType,
  LeaveStatus,
  HalfDaySession,
  AttendanceStatus,
  RegularizationStatus,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  PaymentStatus,
  ClientStatus,
  DailyReportStatus,
} from './enums';

export * from './enums';

// User & Auth
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
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
  panNumber?: string;
  aadharNumber?: string;
  department?: Department;
  manager?: User;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Leave Management
export interface LeaveBalance {
  id: number;
  userId: number;
  year: number;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  compOff: number;
  paternityMaternity: number;
  birthdayLeave?: number;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
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
  user?: User;
  approver?: User;
  approvals?: LeaveApproval[];
}

export interface LeaveApproval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approvalLevel: number;
  status: LeaveStatus;
  comments?: string;
  actionAt?: string;
  approver?: User;
}

// Attendance
export interface Attendance {
  id: number;
  userId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  status: AttendanceStatus;
  workHours: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface AttendanceRegularization {
  id: number;
  userId: number;
  attendanceId?: number;
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: RegularizationStatus;
  approverId?: number;
  approverComments?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  approver?: User;
}

export interface MonthlySummary {
  userId: number;
  month: number;
  year: number;
  summary: {
    totalDays: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    leaveDays: number;
    totalWorkHours: number;
    attendancePercentage: number;
  };
  attendance: Attendance[];
}

// Projects & Tasks
export interface Project {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  ownerId?: number;
  clientId?: number;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  attachmentUrl?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  owner?: User;
  creator?: User;
  client?: Client;
  taskCounts?: {
    todo: number;
    in_progress: number;
    blocked: number;
    done: number;
    approved: number;
  };
  progress?: number;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  taskCode?: string;
  actionRequired?: boolean;
  dependsOnTaskId?: number;
  sortOrder?: number;
  blockReason?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  assignee?: User;
  creator?: User;
  attachments?: TaskAttachment[];
  commentCount?: number;
  isOverdue?: boolean;
  assigneeOnLeave?: boolean;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  linkTitle: string;
  linkUrl: string;
  uploadedBy?: number;
  createdAt: string;
  uploader?: User;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  parentId?: number;
  content: string;
  mentions: number[];
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  replies?: TaskComment[];
}

// Clients
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  status: ClientStatus;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

// Payments
export interface EmployeeSalary {
  id: number;
  userId: number;
  basicSalary: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Payment {
  id: number;
  userId: number;
  salaryId: number;
  paymentMonth: number;
  paymentYear: number;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  paidBy?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  payer?: User;
}

// Daily Reports
export interface DailyReport {
  id: number;
  userId: number;
  reportDate: string;
  title: string;
  description?: string;
  status: DailyReportStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Holidays
export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
  isOptional: boolean;
  year: number;
}

// Notifications
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
}

// Dashboard
export interface DashboardStats {
  user: {
    leaveBalance: LeaveBalance;
  };
  leaves: {
    pending: number;
    approved: number;
  };
  notifications: {
    unread: number;
  };
  approvals?: {
    pending: number;
  };
  admin?: {
    totalEmployees: number;
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

// API Response Types
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
  pagination: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
