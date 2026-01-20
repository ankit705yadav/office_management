import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';
import { Attendance } from '../../../models';
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

describe('My Attendance Records', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await Attendance.destroy({ where: {} });
  });

  describe('GET /api/attendance/my', () => {
    it('should return employee attendance records', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Create some attendance records
      await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      const response = await request(app)
        .get('/api/attendance/my')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.attendance).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by date range', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const today = new Date();
      const weekAgo = subDays(today, 7);

      const response = await request(app)
        .get('/api/attendance/my')
        .query({
          startDate: format(weekAgo, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should paginate results', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/attendance/my')
        .query({ page: 1, limit: 10 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/attendance/my');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attendance/team', () => {
    it('should allow manager to see team attendance', async () => {
      // Employee checks in
      const employeeAuth = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      await request(app)
        .post('/api/attendance/check-in')
        .set(employeeAuth)
        .send({ location: 'Office' });

      // Manager views team attendance
      const managerAuth = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/attendance/team')
        .set(managerAuth);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.attendance).toBeDefined();
    });

    it('should allow admin to see all attendance', async () => {
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/attendance/team')
        .set(adminAuth);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should filter by date', async () => {
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const today = format(new Date(), 'yyyy-MM-dd');

      const response = await request(app)
        .get('/api/attendance/team')
        .query({ date: today })
        .set(adminAuth);

      expect(response.status).toBe(200);
    });

    it('should filter by month and year', async () => {
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/attendance/team')
        .query({ month: 1, year: 2025 })
        .set(adminAuth);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/attendance/monthly', () => {
    it('should return monthly attendance summary', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Check in to create attendance
      await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      const response = await request(app)
        .get('/api/attendance/monthly')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should accept month and year parameters', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/attendance/monthly')
        .query({ month: 1, year: 2025 })
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/attendance/monthly');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attendance/export', () => {
    it('should export attendance as CSV for admin', async () => {
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/attendance/export')
        .set(adminAuth);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should export own attendance for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Check in first
      await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      const response = await request(app)
        .get('/api/attendance/export')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should filter by date range', async () => {
      const adminAuth = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const today = new Date();
      const weekAgo = subDays(today, 7);

      const response = await request(app)
        .get('/api/attendance/export')
        .query({
          startDate: format(weekAgo, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        })
        .set(adminAuth);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/attendance/settings', () => {
    it('should return attendance settings', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/attendance/settings')
        .set(authHeader);

      // May return 404 if no settings exist, which is valid
      expect([200, 404]).toContain(response.status);
    });
  });
});
