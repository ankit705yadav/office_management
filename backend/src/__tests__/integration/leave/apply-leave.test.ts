import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, LeaveType, HalfDaySession } from '../../../types/enums';
import { format, addDays } from 'date-fns';

// Mock the notification and email services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/email.service', () => ({
  sendLeaveRequestNotification: jest.fn().mockResolvedValue(true),
  sendLeaveApprovalNotification: jest.fn().mockResolvedValue(true),
  sendLeaveRejectionNotification: jest.fn().mockResolvedValue(true),
}));

describe('POST /api/leaves', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('successful leave application', () => {
    it('should apply for sick leave', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const startDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 8), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .set(authHeader)
        .send({
          leaveType: LeaveType.SICK,
          startDate,
          endDate,
          reason: 'Medical appointment',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Leave request submitted successfully');
      expect(response.body.data.leaveRequest).toMatchObject({
        leaveType: LeaveType.SICK,
        status: 'pending',
        reason: 'Medical appointment',
      });
    });

    it('should apply for casual leave', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const startDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .set(authHeader)
        .send({
          leaveType: LeaveType.CASUAL,
          startDate,
          endDate,
          reason: 'Personal work',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.leaveRequest.leaveType).toBe(LeaveType.CASUAL);
    });

    it('should apply for half-day leave', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      // Find a non-Sunday weekday
      let targetDate = addDays(new Date(), 21);
      while (targetDate.getDay() === 0) {
        targetDate = addDays(targetDate, 1);
      }
      const dateStr = format(targetDate, 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .set(authHeader)
        .send({
          leaveType: LeaveType.CASUAL,
          startDate: dateStr,
          endDate: dateStr,
          reason: 'Half day personal work',
          isHalfDay: true,
          halfDaySession: HalfDaySession.FIRST_HALF,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.leaveRequest.isHalfDay).toBe(true);
      expect(response.body.data.leaveRequest.halfDaySession).toBe(HalfDaySession.FIRST_HALF);
      expect(Number(response.body.data.leaveRequest.daysCount)).toBe(0.5);
    });
  });

  describe('failed leave application', () => {
    it('should reject leave application with insufficient balance', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const startDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 60), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .set(authHeader)
        .send({
          leaveType: LeaveType.SICK,
          startDate,
          endDate,
          reason: 'Long sick leave',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Insufficient leave balance');
    });

    it('should reject half-day leave without session', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const dateStr = format(addDays(new Date(), 28), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .set(authHeader)
        .send({
          leaveType: LeaveType.CASUAL,
          startDate: dateStr,
          endDate: dateStr,
          reason: 'Half day',
          isHalfDay: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Half-day session');
    });

    it('should reject half-day leave spanning multiple days', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const startDate = format(addDays(new Date(), 35), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 36), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .set(authHeader)
        .send({
          leaveType: LeaveType.CASUAL,
          startDate,
          endDate,
          reason: 'Half day',
          isHalfDay: true,
          halfDaySession: HalfDaySession.FIRST_HALF,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Half-day leave can only be applied for a single day');
    });

    it('should reject unauthenticated leave application', async () => {
      const startDate = format(addDays(new Date(), 40), 'yyyy-MM-dd');

      const response = await request(app)
        .post('/api/leaves')
        .send({
          leaveType: LeaveType.SICK,
          startDate,
          endDate: startDate,
          reason: 'Sick',
        });

      expect(response.status).toBe(401);
    });
  });
});
