// User-related enums
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

// Leave-related enums
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

// Attendance-related enums
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

// Expense-related enums
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

// Inventory-related enums
export enum InventoryStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  UNDER_REPAIR = 'under_repair',
  DAMAGED = 'damaged',
  RETIRED = 'retired',
}

// Project/Task-related enums
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
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

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Chat-related enums
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}
