import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, TaskStatus, TaskPriority } from '../../../types/enums';
import { Task } from '../../../models';

// Mock the notification and socket services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('PATCH /api/projects/tasks/:id/status', () => {
  let testData: TestData;
  let task: Task;

  beforeEach(async () => {
    testData = await seedTestData();

    // Create a task for testing
    task = await Task.create({
      projectId: testData.project.id,
      title: 'Status Test Task',
      description: 'Task for testing status updates',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: testData.employee.id,
      createdBy: testData.manager.id,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('successful status update', () => {
    it('should update task status to in_progress', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in_progress');
    });

    it('should update task status to done', async () => {
      // First update to in_progress
      await task.update({ status: TaskStatus.IN_PROGRESS });

      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({ status: 'done' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
    });

    it('should allow manager to update any task status', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({ status: 'done' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
    });

    it('should allow admin to update any task status', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({ status: 'done' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
    });

    it('should set task to blocked with block reason', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({
          status: 'blocked',
          blockReason: 'Waiting for API documentation',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('blocked');
      expect(response.body.blockReason).toBe('Waiting for API documentation');
    });
  });

  describe('failed status update', () => {
    it('should reject invalid status', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Valid status is required');
    });

    it('should reject status update without status', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject status update for non-existent task', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .patch('/api/projects/tasks/99999/status')
        .set(authHeader)
        .send({ status: 'done' });

      expect(response.status).toBe(404);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .send({ status: 'done' });

      expect(response.status).toBe(401);
    });

    it('should reject blocking a task without reason or dependencies', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .patch(`/api/projects/tasks/${task.id}/status`)
        .set(authHeader)
        .send({ status: 'blocked' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('block');
    });
  });
});
