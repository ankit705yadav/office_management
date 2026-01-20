import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';
import { Attendance } from '../../../models';
import { format } from 'date-fns';

// Mock the notification and email services
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

describe('Attendance Check-In/Check-Out', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean attendance records before each test
    await Attendance.destroy({ where: {} });
  });

  describe('POST /api/attendance/check-in', () => {
    it('should allow employee to check in', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Checked in successfully');
      expect(response.body.data.attendance).toBeDefined();
      expect(response.body.data.attendance.checkInTime).toBeDefined();
    });

    it('should allow manager to check in', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should allow admin to check in', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Remote' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should update existing check-in if already checked in', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // First check-in
      await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      // Second check-in should update
      const response = await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Remote' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/attendance/check-in')
        .send({ location: 'Office' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/attendance/check-out', () => {
    it('should allow employee to check out after check in', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // First check-in
      await request(app)
        .post('/api/attendance/check-in')
        .set(authHeader)
        .send({ location: 'Office' });

      // Then check-out
      const response = await request(app)
        .post('/api/attendance/check-out')
        .set(authHeader)
        .send({ location: 'Office' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Checked out successfully');
      expect(response.body.data.attendance.checkOutTime).toBeDefined();
    });

    it('should reject check out without check in', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/attendance/check-out')
        .set(authHeader)
        .send({ location: 'Office' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not checked in');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/attendance/check-out')
        .send({ location: 'Office' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/attendance/today', () => {
    it('should return today attendance when checked in', async () => {
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
        .get('/api/attendance/today')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.attendance).toBeDefined();
    });

    it('should return null when not checked in', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/attendance/today')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.attendance).toBeNull();
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/attendance/today');

      expect(response.status).toBe(401);
    });
  });
});
