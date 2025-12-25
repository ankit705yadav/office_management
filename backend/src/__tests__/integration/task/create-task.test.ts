import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';

// Mock the notification and socket services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('POST /api/projects/tasks', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('successful task creation', () => {
    it('should allow manager to create task', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
          title: 'Test Task',
          description: 'Test task description',
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'high',
      });
    });

    it('should allow admin to create task', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
          title: 'Admin Task',
          description: 'Task created by admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Admin Task');
    });

    it('should create task with assignee', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
          title: 'Assigned Task',
          description: 'Task with assignee',
          assigneeId: testData.employee.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.assigneeId).toBe(testData.employee.id);
    });

    it('should create task with due date', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
          title: 'Task with Due Date',
          dueDate: dueDate.toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeDefined();
    });

    it('should create task with tags', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
          title: 'Task with Tags',
          tags: ['frontend', 'bug'],
        });

      expect(response.status).toBe(201);
      expect(response.body.tags).toEqual(['frontend', 'bug']);
    });
  });

  describe('failed task creation', () => {
    it('should reject task creation from employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
          title: 'Employee Task',
        });

      expect(response.status).toBe(403);
    });

    it('should reject task without project ID', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          title: 'Task without project',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Project ID and title are required');
    });

    it('should reject task without title', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: testData.project.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Project ID and title are required');
    });

    it('should reject task with non-existent project', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/projects/tasks')
        .set(authHeader)
        .send({
          projectId: 99999,
          title: 'Task for non-existent project',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Project not found');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/projects/tasks')
        .send({
          projectId: testData.project.id,
          title: 'Unauthenticated Task',
        });

      expect(response.status).toBe(401);
    });
  });
});
