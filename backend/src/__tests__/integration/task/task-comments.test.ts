import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, TaskStatus, TaskPriority } from '../../../types/enums';
import { Task, TaskComment } from '../../../models';

// Mock the notification and socket services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('Task Comments API', () => {
  let testData: TestData;
  let task: Task;

  beforeEach(async () => {
    testData = await seedTestData();

    // Create a task for testing
    task = await Task.create({
      projectId: testData.project.id,
      title: 'Comment Test Task',
      description: 'Task for testing comments',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: testData.employee.id,
      createdBy: testData.manager.id,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/projects/tasks/:taskId/comments', () => {
    it('should create a comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post(`/api/projects/tasks/${task.id}/comments`)
        .set(authHeader)
        .send({ content: 'This is a test comment' });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('This is a test comment');
      expect(response.body.userId).toBe(testData.employee.id);
    });

    it('should create a comment with mentions', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post(`/api/projects/tasks/${task.id}/comments`)
        .set(authHeader)
        .send({
          content: `Hey @[${testData.employee.id}:Employee User], can you check this?`,
        });

      expect(response.status).toBe(201);
      expect(response.body.mentions).toContain(testData.employee.id);
    });

    it('should create a reply to a comment', async () => {
      // First create a parent comment
      const parentComment = await TaskComment.create({
        taskId: task.id,
        userId: testData.manager.id,
        content: 'Parent comment',
      });

      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post(`/api/projects/tasks/${task.id}/comments`)
        .set(authHeader)
        .send({
          content: 'This is a reply',
          parentId: parentComment.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.parentId).toBe(parentComment.id);
    });

    it('should reject empty comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post(`/api/projects/tasks/${task.id}/comments`)
        .set(authHeader)
        .send({ content: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Content is required');
    });

    it('should reject comment on non-existent task', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/projects/tasks/99999/comments')
        .set(authHeader)
        .send({ content: 'Comment on non-existent task' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/projects/tasks/:taskId/comments', () => {
    beforeEach(async () => {
      // Create some comments
      await TaskComment.create({
        taskId: task.id,
        userId: testData.manager.id,
        content: 'First comment',
      });

      await TaskComment.create({
        taskId: task.id,
        userId: testData.employee.id,
        content: 'Second comment',
      });
    });

    it('should get all comments for a task', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get(`/api/projects/tasks/${task.id}/comments`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should include author information', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get(`/api/projects/tasks/${task.id}/comments`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body[0].author).toBeDefined();
      expect(response.body[0].author).toHaveProperty('firstName');
      expect(response.body[0].author).toHaveProperty('lastName');
    });
  });

  describe('PUT /api/projects/tasks/:taskId/comments/:commentId', () => {
    let comment: TaskComment;

    beforeEach(async () => {
      comment = await TaskComment.create({
        taskId: task.id,
        userId: testData.employee.id,
        content: 'Original comment',
      });
    });

    it('should update own comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put(`/api/projects/tasks/${task.id}/comments/${comment.id}`)
        .set(authHeader)
        .send({ content: 'Updated comment' });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Updated comment');
      expect(response.body.isEdited).toBe(true);
    });

    it('should allow admin to update any comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/projects/tasks/${task.id}/comments/${comment.id}`)
        .set(authHeader)
        .send({ content: 'Admin updated comment' });

      expect(response.status).toBe(200);
    });

    it('should reject update from non-author', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/projects/tasks/${task.id}/comments/${comment.id}`)
        .set(authHeader)
        .send({ content: 'Manager trying to update' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/projects/tasks/:taskId/comments/:commentId', () => {
    let comment: TaskComment;

    beforeEach(async () => {
      comment = await TaskComment.create({
        taskId: task.id,
        userId: testData.employee.id,
        content: 'Comment to delete',
      });
    });

    it('should delete own comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .delete(`/api/projects/tasks/${task.id}/comments/${comment.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);

      // Verify comment is deleted
      const deletedComment = await TaskComment.findByPk(comment.id);
      expect(deletedComment).toBeNull();
    });

    it('should allow admin to delete any comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete(`/api/projects/tasks/${task.id}/comments/${comment.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should allow manager to delete any comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .delete(`/api/projects/tasks/${task.id}/comments/${comment.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent comment', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete(`/api/projects/tasks/${task.id}/comments/99999`)
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });
});
