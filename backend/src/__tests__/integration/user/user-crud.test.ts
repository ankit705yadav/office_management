import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, UserStatus } from '../../../types/enums';
import { User } from '../../../models';

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

describe('User CRUD Operations', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should allow manager to get users', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/users')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should paginate results', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 5 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should filter by search term', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users')
        .query({ search: 'employee' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should filter by role', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users')
        .query({ role: 'employee' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should filter by status', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users')
        .query({ status: 'active' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/users/${testData.employee.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testData.employee.email);
    });

    it('should return 404 for non-existent user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should not include password hash in response', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/users/${testData.employee.id}`)
        .set(authHeader);

      expect(response.body.data.user.passwordHash).toBeUndefined();
    });
  });

  describe('POST /api/users', () => {
    it('should allow admin to create user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const newUser = {
        email: `newuser_${Date.now()}@test.com`,
        password: 'TestPass@123',
        firstName: 'New',
        lastName: 'User',
        dateOfJoining: new Date().toISOString(),
        role: 'employee',
        departmentId: testData.department.id,
      };

      const response = await request(app)
        .post('/api/users')
        .set(authHeader)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(newUser.email);
    });

    it('should reject duplicate email', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const newUser = {
        email: testData.employee.email, // Duplicate
        password: 'TestPass@123',
        firstName: 'Duplicate',
        lastName: 'User',
        dateOfJoining: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/users')
        .set(authHeader)
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email already exists');
    });

    it('should reject user creation by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const newUser = {
        email: 'notallowed@test.com',
        password: 'TestPass@123',
        firstName: 'Not',
        lastName: 'Allowed',
        dateOfJoining: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/users')
        .set(authHeader)
        .send(newUser);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow admin to update any user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/users/${testData.employee.id}`)
        .set(authHeader)
        .send({ firstName: 'Updated', lastName: 'Name' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should allow user to update own profile', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put(`/api/users/${testData.employee.id}`)
        .set(authHeader)
        .send({ phone: '1234567890' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put('/api/users/99999')
        .set(authHeader)
        .send({ firstName: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should reject changing to duplicate email', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/users/${testData.employee.id}`)
        .set(authHeader)
        .send({ email: testData.manager.email }); // Duplicate

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deletableUserId: number;

    beforeEach(async () => {
      // Create a user to delete
      const user = await User.create({
        email: `deletable_${Date.now()}@test.com`,
        passwordHash: 'Test@123',
        firstName: 'Deletable',
        lastName: 'User',
        dateOfJoining: new Date(),
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        departmentId: testData.department.id,
      });
      deletableUserId = user.id;
    });

    it('should allow admin to soft delete user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete(`/api/users/${deletableUserId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify user is terminated, not deleted
      const user = await User.findByPk(deletableUserId);
      expect(user?.status).toBe(UserStatus.TERMINATED);
    });

    it('should reject deletion by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .delete(`/api/users/${deletableUserId}`)
        .set(authHeader);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete('/api/users/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/:id/team', () => {
    it('should return user team for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get(`/api/users/${testData.manager.id}/team`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.team).toBeDefined();
    });

    it('should return empty team for user without subordinates', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/users/${testData.employee.id}/team`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.team).toEqual([]);
    });
  });

  describe('GET /api/users/departments', () => {
    it('should return all departments', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/users/departments')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.departments).toBeDefined();
    });
  });

  describe('GET /api/users/list-basic', () => {
    it('should return basic user list', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/users/list-basic')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/users/list-basic')
        .query({ status: 'active' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });
});
