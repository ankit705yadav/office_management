import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';

describe('POST /api/auth/login', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('successful login', () => {
    it('should login with valid employee credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'Employee@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        email: 'employee@test.com',
        firstName: 'Employee',
        lastName: 'User',
        role: 'employee',
      });
    });

    it('should login with valid manager credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@test.com',
          password: 'Manager@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe('manager');
    });

    it('should login with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe('admin');
    });
  });

  describe('failed login', () => {
    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject inactive user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'Inactive@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not active');
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password@123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password@123',
        });

      expect(response.status).toBe(400);
    });
  });
});
