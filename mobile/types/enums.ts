// Enums matching backend types

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

export enum UserStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

export enum LeaveType {
  SICK = 'sick',
  CASUAL = 'casual',
  EARNED = 'earned',
  COMP_OFF = 'comp_off',
  PATERNITY = 'paternity',
  MATERNITY = 'maternity',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum HalfDaySession {
  FIRST_HALF = 'first_half',
  SECOND_HALF = 'second_half',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday',
}

export enum RegularizationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done',
  APPROVED = 'approved',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum DailyReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}
