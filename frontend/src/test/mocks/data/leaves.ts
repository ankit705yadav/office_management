export const mockLeaveBalance = {
  id: 1,
  userId: 3,
  year: new Date().getFullYear(),
  sickLeave: 12,
  casualLeave: 12,
  earnedLeave: 15,
  compOff: 2,
  paternityMaternity: 0,
  user: {
    id: 3,
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@test.com',
  },
};

export const mockLeaveRequest = {
  id: 1,
  userId: 3,
  leaveType: 'casual',
  startDate: '2025-01-15',
  endDate: '2025-01-16',
  daysCount: 2,
  reason: 'Personal work',
  status: 'pending',
  isHalfDay: false,
  halfDaySession: null,
  currentApprovalLevel: 0,
  totalApprovalLevels: 2,
  createdAt: '2025-01-10T10:00:00.000Z',
  user: {
    id: 3,
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@test.com',
  },
  approvals: [
    {
      id: 1,
      approverId: 2,
      status: 'pending',
      approvalOrder: 1,
      approver: {
        id: 2,
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@test.com',
        role: 'manager',
      },
    },
  ],
};

export const mockLeaveRequests = [mockLeaveRequest];
