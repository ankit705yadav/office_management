import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';
import { Notification } from '../../../models';

// Mock services
jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('Notification Operations', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await Notification.destroy({ where: {} });
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await Notification.bulkCreate([
        {
          userId: testData.employee.id,
          type: 'leave',
          title: 'Leave Approved',
          message: 'Your leave request has been approved',
          isRead: false,
        },
        {
          userId: testData.employee.id,
          type: 'task',
          title: 'Task Assigned',
          message: 'You have been assigned a new task',
          isRead: true,
        },
        {
          userId: testData.employee.id,
          type: 'attendance',
          title: 'Attendance Reminder',
          message: 'Please check in',
          isRead: false,
        },
      ]);
    });

    it('should return notifications for user', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/notifications')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toBeDefined();
      expect(response.body.data.notifications.length).toBe(3);
    });

    it('should paginate results', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/notifications')
        .query({ page: 1, limit: 2 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.notifications.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should not return other users notifications', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/notifications')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.notifications.length).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    beforeEach(async () => {
      await Notification.bulkCreate([
        {
          userId: testData.employee.id,
          type: 'leave',
          title: 'Test 1',
          message: 'Test',
          isRead: false,
        },
        {
          userId: testData.employee.id,
          type: 'task',
          title: 'Test 2',
          message: 'Test',
          isRead: false,
        },
        {
          userId: testData.employee.id,
          type: 'attendance',
          title: 'Test 3',
          message: 'Test',
          isRead: true,
        },
      ]);
    });

    it('should return unread notification count', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.unreadCount).toBe(2);
    });

    it('should return 0 for user with no unread notifications', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.unreadCount).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let testNotificationId: number;

    beforeEach(async () => {
      const notification = await Notification.create({
        userId: testData.employee.id,
        type: 'test',
        title: 'Unread Notification',
        message: 'Test message',
        isRead: false,
      });
      testNotificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put(`/api/notifications/${testNotificationId}/read`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify notification is marked as read
      const notification = await Notification.findByPk(testNotificationId);
      expect(notification?.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/notifications/99999/read')
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should not allow marking other users notifications as read', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/notifications/${testNotificationId}/read`)
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should reject invalid notification id', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/notifications/invalid/read')
        .set(authHeader);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    beforeEach(async () => {
      await Notification.bulkCreate([
        {
          userId: testData.employee.id,
          type: 'test',
          title: 'Notification 1',
          message: 'Test',
          isRead: false,
        },
        {
          userId: testData.employee.id,
          type: 'test',
          title: 'Notification 2',
          message: 'Test',
          isRead: false,
        },
        {
          userId: testData.employee.id,
          type: 'test',
          title: 'Notification 3',
          message: 'Test',
          isRead: false,
        },
      ]);
    });

    it('should mark all notifications as read', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify all notifications are marked as read
      const unreadCount = await Notification.count({
        where: { userId: testData.employee.id, isRead: false },
      });
      expect(unreadCount).toBe(0);
    });

    it('should not affect other users notifications', async () => {
      // Create notification for another user
      await Notification.create({
        userId: testData.manager.id,
        type: 'test',
        title: 'Manager Notification',
        message: 'Test',
        isRead: false,
      });

      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      await request(app)
        .put('/api/notifications/read-all')
        .set(authHeader);

      // Verify manager's notification is still unread
      const managerUnreadCount = await Notification.count({
        where: { userId: testData.manager.id, isRead: false },
      });
      expect(managerUnreadCount).toBe(1);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let testNotificationId: number;

    beforeEach(async () => {
      const notification = await Notification.create({
        userId: testData.employee.id,
        type: 'test',
        title: 'Deletable Notification',
        message: 'Test message',
        isRead: false,
      });
      testNotificationId = notification.id;
    });

    it('should delete notification', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .delete(`/api/notifications/${testNotificationId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify notification is deleted
      const notification = await Notification.findByPk(testNotificationId);
      expect(notification).toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .delete('/api/notifications/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should not allow deleting other users notifications', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .delete(`/api/notifications/${testNotificationId}`)
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should reject invalid notification id', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .delete('/api/notifications/invalid')
        .set(authHeader);

      expect(response.status).toBe(400);
    });
  });
});
