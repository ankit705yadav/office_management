import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';
import { Notification, LeaveRequest } from '../../../models';
import { format, addDays } from 'date-fns';

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

describe('Dashboard Operations', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard stats for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.user).toBeDefined();
      expect(response.body.data.stats.leaves).toBeDefined();
      expect(response.body.data.stats.notifications).toBeDefined();
    });

    it('should return additional stats for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.stats.approvals).toBeDefined();
    });

    it('should return admin-specific stats', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.stats.admin).toBeDefined();
      expect(response.body.data.stats.admin.totalEmployees).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/birthdays', () => {
    it('should return upcoming birthdays', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/birthdays')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.birthdays).toBeDefined();
    });

    it('should limit results', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/birthdays')
        .query({ limit: 5 })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/dashboard/anniversaries', () => {
    it('should return work anniversaries', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/anniversaries')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.anniversaries).toBeDefined();
    });
  });

  describe('GET /api/dashboard/activities', () => {
    beforeEach(async () => {
      // Create test notifications
      await Notification.create({
        userId: testData.employee.id,
        type: 'test',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
      });
    });

    it('should return recent activities', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/activities')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.activities).toBeDefined();
    });

    it('should limit results', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/activities')
        .query({ limit: 5 })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/dashboard/notifications/:id/read', () => {
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
        .put(`/api/dashboard/notifications/${testNotificationId}/read`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent notification', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/dashboard/notifications/99999/read')
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should not allow reading other users notifications', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .put(`/api/dashboard/notifications/${testNotificationId}/read`)
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/dashboard/notifications/read-all', () => {
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
      ]);
    });

    it('should mark all notifications as read', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put('/api/dashboard/notifications/read-all')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/dashboard/employees-on-leave', () => {
    it('should return empty list for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/employees-on-leave')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.employeesOnLeave).toEqual([]);
    });

    it('should return employees on leave for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/dashboard/employees-on-leave')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.employeesOnLeave).toBeDefined();
    });

    it('should return all employees on leave for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/dashboard/employees-on-leave')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.employeesOnLeave).toBeDefined();
    });
  });

  describe('GET /api/dashboard/team-calendar', () => {
    it('should return own leaves for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/dashboard/team-calendar')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.leaves).toBeDefined();
    });

    it('should return team leaves for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/dashboard/team-calendar')
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should filter by date range', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const today = new Date();
      const nextMonth = addDays(today, 30);

      const response = await request(app)
        .get('/api/dashboard/team-calendar')
        .query({
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(nextMonth, 'yyyy-MM-dd'),
        })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });
});
