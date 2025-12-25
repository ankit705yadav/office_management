import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { generateTestTokens } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';

describe('POST /api/auth/refresh-token', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('successful token refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const { refreshToken } = generateTestTokens({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return new tokens that are different from old ones', async () => {
      const { refreshToken } = generateTestTokens({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Wait 1.1 seconds to ensure different token `iat` timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });
  });

  describe('failed token refresh', () => {
    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Refresh token is required');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('should reject refresh token for inactive user', async () => {
      const { refreshToken } = generateTestTokens({
        id: testData.inactiveUser.id,
        email: testData.inactiveUser.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User not found or inactive');
    });

    it('should reject refresh token for non-existent user', async () => {
      const { refreshToken } = generateTestTokens({
        id: 999999,
        email: 'nonexistent@test.com',
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
});
