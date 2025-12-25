import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';

describe('GET /api/auth/me', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('get current user profile', () => {
    it('should return current user for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toMatchObject({
        id: testData.employee.id,
        email: 'employee@test.com',
        firstName: 'Employee',
        lastName: 'User',
        role: 'employee',
      });
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return current user for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('manager');
    });

    it('should return current user for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should include department information', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.user.department).toBeDefined();
      expect(response.body.data.user.department.name).toBe('Engineering');
    });

    it('should include manager information for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.user.manager).toBeDefined();
      expect(response.body.data.user.manager.email).toBe('manager@test.com');
    });
  });

  describe('unauthorized access', () => {
    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set({ Authorization: 'Bearer invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
});
