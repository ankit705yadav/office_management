import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';

describe('POST /api/auth/logout', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('successful logout', () => {
    it('should logout authenticated user', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('failed logout', () => {
    it('should reject unauthenticated logout request', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set({ Authorization: 'Bearer invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
});
