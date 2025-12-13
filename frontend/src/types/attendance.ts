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

export interface Attendance {
  id: number;
  userId: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLocation?: string;
  checkOutLocation?: string;
  status: AttendanceStatus;
  workHours: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AttendanceRegularization {
  id: number;
  userId: number;
  attendanceId?: number;
  date: string;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  requestedLocation?: string;
  reason: string;
  status: RegularizationStatus;
  approverId?: number;
  approvedRejectedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AttendanceSetting {
  id: number;
  departmentId?: number;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  workingDays: number[];
  autoCheckoutEnabled: boolean;
  autoCheckoutTime: string;
  locationTrackingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CheckInRequest {
  location?: string;
}

export interface CheckOutRequest {
  location?: string;
}

export interface RegularizationRequest {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  location?: string;
}

export interface ApproveRegularizationRequest {
  comments?: string;
}

export interface RejectRegularizationRequest {
  comments: string;
}

export interface AttendanceFilters {
  userId?: number;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}
