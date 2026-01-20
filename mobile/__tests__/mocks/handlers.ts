// Mock data for testing

export const mockUser = {
  id: 1,
  email: 'employee@test.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'employee',
  status: 'active',
  departmentId: 1,
  department: {
    id: 1,
    name: 'Engineering',
  },
};

export const mockAdmin = {
  id: 2,
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  status: 'active',
  departmentId: 1,
};

export const mockAttendance = {
  id: 1,
  userId: 1,
  date: '2025-01-21',
  checkInTime: '2025-01-21T09:00:00.000Z',
  checkOutTime: null,
  status: 'present',
  workHours: 0,
  isLate: false,
};

export const mockLeaveBalance = {
  id: 1,
  userId: 1,
  year: 2025,
  sickLeave: 12,
  casualLeave: 12,
  earnedLeave: 5,
  compOff: 2,
  birthdayLeave: 1,
};

export const mockLeaveRequest = {
  id: 1,
  userId: 1,
  leaveType: 'casual',
  startDate: '2025-01-25',
  endDate: '2025-01-26',
  daysCount: 2,
  reason: 'Personal work',
  status: 'pending',
};

export const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  departmentId: 1,
};

export const mockTask = {
  id: 1,
  projectId: 1,
  title: 'Test Task',
  description: 'A test task',
  status: 'todo',
  priority: 'medium',
};

export const mockHoliday = {
  id: 1,
  name: 'New Year',
  date: '2025-01-01',
  year: 2025,
  isOptional: false,
};

export const mockDashboardStats = {
  user: {
    leaveBalance: mockLeaveBalance,
  },
  leaves: {
    pending: 1,
    approved: 2,
  },
  notifications: {
    unread: 3,
  },
};
