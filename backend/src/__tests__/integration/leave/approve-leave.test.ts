import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, LeaveType, RequestStatus, UserStatus } from '../../../types/enums';
import { LeaveRequest, LeaveApproval, LeaveBalance, User } from '../../../models';
import { ApprovalStatus } from '../../../models/LeaveApproval';
import { addDays } from 'date-fns';

// Mock the notification and email services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/email.service', () => ({
  sendLeaveRequestNotification: jest.fn().mockResolvedValue(true),
  sendLeaveApprovalNotification: jest.fn().mockResolvedValue(true),
  sendLeaveRejectionNotification: jest.fn().mockResolvedValue(true),
}));

describe('PUT /api/leaves/:id/approve', () => {
  let testData: TestData;
  let leaveRequest: LeaveRequest;

  beforeEach(async () => {
    testData = await seedTestData();

    // Create a leave request for the employee
    leaveRequest = await LeaveRequest.create({
      userId: testData.employee.id,
      leaveType: LeaveType.CASUAL,
      startDate: addDays(new Date(), 10),
      endDate: addDays(new Date(), 11),
      daysCount: 2,
      reason: 'Personal work',
      status: RequestStatus.PENDING,
      currentApprovalLevel: 0,
      totalApprovalLevels: 2,
    });

    // Create approval records for manager and admin
    await LeaveApproval.create({
      leaveRequestId: leaveRequest.id,
      approverId: testData.manager.id,
      approvalOrder: 1,
      status: ApprovalStatus.PENDING,
    });

    await LeaveApproval.create({
      leaveRequestId: leaveRequest.id,
      approverId: testData.admin.id,
      approvalOrder: 2,
      status: ApprovalStatus.PENDING,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('successful approval', () => {
    it('should allow manager to approve as first approver', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(authHeader)
        .send({ comments: 'Approved by manager' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('approved');

      // Verify the approval record was updated
      const approval = await LeaveApproval.findOne({
        where: { leaveRequestId: leaveRequest.id, approverId: testData.manager.id },
      });
      expect(approval?.status).toBe('approved');
    });

    it('should fully approve when all approvers approve', async () => {
      // First, manager approves
      const managerAuthHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(managerAuthHeader)
        .send({ comments: 'Approved by manager' });

      // Then, admin approves
      const adminAuthHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(adminAuthHeader)
        .send({ comments: 'Final approval' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('fully approved');

      // Verify leave request status is approved
      const updatedRequest = await LeaveRequest.findByPk(leaveRequest.id);
      expect(updatedRequest?.status).toBe('approved');
    });

    it('should deduct leave balance after full approval', async () => {
      // Get initial balance
      const initialBalance = await LeaveBalance.findOne({
        where: { userId: testData.employee.id, year: new Date().getFullYear() },
      });
      const initialCasual = Number(initialBalance?.casualLeave);

      // Manager approves
      const managerAuthHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(managerAuthHeader)
        .send({});

      // Admin approves
      const adminAuthHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(adminAuthHeader)
        .send({});

      // Check balance was deducted
      const updatedBalance = await LeaveBalance.findOne({
        where: { userId: testData.employee.id, year: new Date().getFullYear() },
      });
      expect(Number(updatedBalance?.casualLeave)).toBe(initialCasual - leaveRequest.daysCount);
    });
  });

  describe('failed approval', () => {
    it('should reject approval from unauthorized user', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(authHeader)
        .send({});

      expect(response.status).toBe(403);
    });

    it('should reject approval when not in approval chain', async () => {
      // Create another manager who is not in the approval chain
      const otherManager = await User.create({
        email: 'othermanager@test.com',
        passwordHash: 'Manager@123',
        firstName: 'Other',
        lastName: 'Manager',
        dateOfJoining: new Date('2023-01-01'),
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        departmentId: testData.department.id,
      });

      const authHeader = getAuthHeader({
        id: otherManager.id,
        email: otherManager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(authHeader)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not authorized');
    });

    it('should reject admin approval before manager approves', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Previous approvers must approve first');
    });

    it('should reject approval of already processed request', async () => {
      // First, fully approve the request
      const managerAuthHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(managerAuthHeader)
        .send({});

      const adminAuthHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(adminAuthHeader)
        .send({});

      // Try to approve again
      const response = await request(app)
        .put(`/api/leaves/${leaveRequest.id}/approve`)
        .set(managerAuthHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already been processed');
    });

    it('should reject approval of non-existent leave request', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put('/api/leaves/99999/approve')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(404);
    });
  });
});
