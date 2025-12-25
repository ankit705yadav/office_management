import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';

describe('GET /api/leaves/balance', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('get own leave balance', () => {
    it('should return employee leave balance', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/leaves/balance')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.leaveBalance).toMatchObject({
        userId: testData.employee.id,
        year: new Date().getFullYear(),
        sickLeave: '12.0',
        casualLeave: '12.0',
        earnedLeave: '15.0',
      });
    });

    it('should return manager leave balance', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/leaves/balance')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      // Manager may not have leave balance created, should create one
      expect(response.body.data.leaveBalance).toBeDefined();
    });
  });

  describe('get other user leave balance', () => {
    it('should allow manager to get employee balance', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get(`/api/leaves/balance?userId=${testData.employee.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.leaveBalance.userId).toBe(testData.employee.id);
    });

    it('should allow admin to get any user balance', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/leaves/balance?userId=${testData.employee.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.leaveBalance.userId).toBe(testData.employee.id);
    });
  });

  describe('balance for specific year', () => {
    it('should get balance for specific year', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const currentYear = new Date().getFullYear();
      const response = await request(app)
        .get(`/api/leaves/balance?year=${currentYear}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.leaveBalance.year).toBe(currentYear);
    });

    it('should create balance for new year if not exists', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const nextYear = new Date().getFullYear() + 1;
      const response = await request(app)
        .get(`/api/leaves/balance?year=${nextYear}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.leaveBalance.year).toBe(nextYear);
    });
  });

  describe('unauthorized access', () => {
    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/leaves/balance');

      expect(response.status).toBe(401);
    });
  });
});
