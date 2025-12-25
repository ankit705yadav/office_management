import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';

describe('PUT /api/auth/change-password', () => {
  let testData: TestData;

  beforeEach(async () => {
    // Create fresh test data for each test since we're modifying passwords
    testData = await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('successful password change', () => {
    it('should change password with valid current password', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(authHeader)
        .send({
          currentPassword: 'Employee@123',
          newPassword: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password changed successfully');

      // Verify new password works for login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'NewPassword@123',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should invalidate old password after change', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Change password
      await request(app)
        .put('/api/auth/change-password')
        .set(authHeader)
        .send({
          currentPassword: 'Employee@123',
          newPassword: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });

      // Verify old password no longer works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'Employee@123',
        });

      expect(loginResponse.status).toBe(401);
    });
  });

  describe('failed password change', () => {
    it('should reject incorrect current password', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(authHeader)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
          confirmPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should reject missing current password', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(authHeader)
        .send({
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing new password', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(authHeader)
        .send({
          currentPassword: 'Employee@123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'Employee@123',
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(401);
    });
  });
});
