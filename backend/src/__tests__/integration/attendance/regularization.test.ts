import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, RegularizationStatus } from '../../../types/enums';
import { Attendance } from '../../../models';
import AttendanceRegularization from '../../../models/AttendanceRegularization';
import { format, subDays } from 'date-fns';

// Mock services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('Attendance Regularization', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await Attendance.destroy({ where: {} });
    await AttendanceRegularization.destroy({ where: {} });
  });

  describe('POST /api/attendance/regularize', () => {
    it('should allow employee to request regularization', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 3);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/attendance/regularize')
        .set(authHeader)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          requestedCheckOut: `${dateStr}T18:00:00`,
          reason: 'Forgot to check in',
          location: 'Office',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.regularization).toBeDefined();
      expect(response.body.data.regularization.status).toBe(RegularizationStatus.PENDING);
    });

    it('should reject regularization for future date', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const futureDate = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/attendance/regularize')
        .set(authHeader)
        .send({
          date: futureDate,
          requestedCheckIn: `${futureDate}T09:00:00`,
          reason: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('future dates');
    });

    it('should reject duplicate pending regularization', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 3);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      // First request
      await request(app)
        .post('/api/attendance/regularize')
        .set(authHeader)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'First request',
        });

      // Duplicate request
      const response = await request(app)
        .post('/api/attendance/regularize')
        .set(authHeader)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'Second request',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('pending regularization');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/attendance/regularize')
        .send({
          date: '2025-01-01',
          reason: 'Test',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attendance/regularizations', () => {
    it('should return employee own regularizations', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Create a regularization request first
      const pastDate = subDays(new Date(), 3);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      await request(app)
        .post('/api/attendance/regularize')
        .set(authHeader)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'Test',
        });

      const response = await request(app)
        .get('/api/attendance/regularizations')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.regularizations).toBeDefined();
      expect(response.body.data.regularizations.length).toBeGreaterThan(0);
    });

    it('should allow manager to see team regularizations', async () => {
      // Create regularization as employee
      const employeeAuth = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 3);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      await request(app)
        .post('/api/attendance/regularize')
        .set(employeeAuth)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'Test',
        });

      // Get as manager
      const managerAuth = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/attendance/regularizations')
        .set(managerAuth);

      expect(response.status).toBe(200);
      expect(response.body.data.regularizations).toBeDefined();
    });

    it('should allow admin to see all regularizations', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/attendance/regularizations')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should filter by status', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/attendance/regularizations')
        .query({ status: 'pending' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/attendance/regularizations/:id/approve', () => {
    it('should allow manager to approve regularization', async () => {
      // Create regularization as employee
      const employeeAuth = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 3);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      const createResponse = await request(app)
        .post('/api/attendance/regularize')
        .set(employeeAuth)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          requestedCheckOut: `${dateStr}T18:00:00`,
          reason: 'Test',
        });

      const regularizationId = createResponse.body.data.regularization.id;

      // Approve as manager
      const managerAuth = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/attendance/regularizations/${regularizationId}/approve`)
        .set(managerAuth)
        .send({ comments: 'Approved' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.regularization.status).toBe(RegularizationStatus.APPROVED);
    });

    it('should allow admin to approve regularization', async () => {
      // Create regularization as employee
      const employeeAuth = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 4);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      const createResponse = await request(app)
        .post('/api/attendance/regularize')
        .set(employeeAuth)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'Test',
        });

      const regularizationId = createResponse.body.data.regularization.id;

      // Approve as admin
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/attendance/regularizations/${regularizationId}/approve`)
        .set(adminAuth)
        .send({ comments: 'Admin approved' });

      expect(response.status).toBe(200);
      expect(response.body.data.regularization.status).toBe(RegularizationStatus.APPROVED);
    });

    it('should reject approval of non-existent regularization', async () => {
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put('/api/attendance/regularizations/99999/approve')
        .set(adminAuth)
        .send({ comments: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/attendance/regularizations/:id/reject', () => {
    it('should allow manager to reject regularization', async () => {
      // Create regularization as employee
      const employeeAuth = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 5);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      const createResponse = await request(app)
        .post('/api/attendance/regularize')
        .set(employeeAuth)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'Test',
        });

      const regularizationId = createResponse.body.data.regularization.id;

      // Reject as manager
      const managerAuth = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/attendance/regularizations/${regularizationId}/reject`)
        .set(managerAuth)
        .send({ comments: 'Invalid request' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.regularization.status).toBe(RegularizationStatus.REJECTED);
    });

    it('should reject already processed regularization', async () => {
      // Create and approve regularization
      const employeeAuth = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const pastDate = subDays(new Date(), 6);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      const createResponse = await request(app)
        .post('/api/attendance/regularize')
        .set(employeeAuth)
        .send({
          date: dateStr,
          requestedCheckIn: `${dateStr}T09:00:00`,
          reason: 'Test',
        });

      const regularizationId = createResponse.body.data.regularization.id;

      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      // Approve first
      await request(app)
        .put(`/api/attendance/regularizations/${regularizationId}/approve`)
        .set(adminAuth)
        .send({ comments: 'Approved' });

      // Try to reject
      const response = await request(app)
        .put(`/api/attendance/regularizations/${regularizationId}/reject`)
        .set(adminAuth)
        .send({ comments: 'Rejected' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already been processed');
    });
  });
});
