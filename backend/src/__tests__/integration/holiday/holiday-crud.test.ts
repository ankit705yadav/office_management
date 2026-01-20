import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';
import { Holiday } from '../../../models';
import { format, addDays } from 'date-fns';

// Mock services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('Holiday CRUD Operations', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await Holiday.destroy({ where: {} });
  });

  describe('GET /api/holidays', () => {
    beforeEach(async () => {
      // Create some holidays
      await Holiday.bulkCreate([
        {
          name: 'New Year',
          date: new Date('2025-01-01'),
          year: 2025,
          isOptional: false,
        },
        {
          name: 'Optional Holiday',
          date: new Date('2025-03-15'),
          year: 2025,
          isOptional: true,
        },
      ]);
    });

    it('should return all holidays for current year', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/holidays')
        .query({ year: 2025 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.holidays).toBeDefined();
      expect(response.body.data.holidays.length).toBeGreaterThan(0);
    });

    it('should filter by optional status', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/holidays')
        .query({ year: 2025, isOptional: 'true' })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.holidays.every((h: any) => h.isOptional)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/holidays');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/holidays/upcoming', () => {
    beforeEach(async () => {
      // Create future holidays
      const today = new Date();
      await Holiday.bulkCreate([
        {
          name: 'Upcoming Holiday 1',
          date: addDays(today, 5),
          year: today.getFullYear(),
          isOptional: false,
        },
        {
          name: 'Upcoming Holiday 2',
          date: addDays(today, 10),
          year: today.getFullYear(),
          isOptional: false,
        },
      ]);
    });

    it('should return upcoming holidays', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/holidays/upcoming')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.holidays).toBeDefined();
    });

    it('should limit results', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/holidays/upcoming')
        .query({ limit: 1 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.holidays.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/holidays/:id', () => {
    let testHolidayId: number;

    beforeEach(async () => {
      const holiday = await Holiday.create({
        name: 'Test Holiday',
        date: new Date('2025-06-15'),
        year: 2025,
        isOptional: false,
      });
      testHolidayId = holiday.id;
    });

    it('should return holiday by id', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get(`/api/holidays/${testHolidayId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.holiday.id).toBe(testHolidayId);
    });

    it('should return 404 for non-existent holiday', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/holidays/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/holidays', () => {
    it('should allow admin to create holiday', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const newHoliday = {
        name: 'Independence Day',
        date: '2025-08-15',
        description: 'National holiday',
        isOptional: false,
      };

      const response = await request(app)
        .post('/api/holidays')
        .set(authHeader)
        .send(newHoliday);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.holiday.name).toBe(newHoliday.name);
    });

    it('should reject holiday creation by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/holidays')
        .set(authHeader)
        .send({
          name: 'Test Holiday',
          date: '2025-12-25',
        });

      expect(response.status).toBe(403);
    });

    it('should auto-extract year from date', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/holidays')
        .set(authHeader)
        .send({
          name: 'Christmas',
          date: '2025-12-25',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.holiday.year).toBe(2025);
    });
  });

  describe('POST /api/holidays/bulk', () => {
    it('should allow admin to bulk create holidays', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const holidays = [
        { name: 'Holiday 1', date: '2025-05-01' },
        { name: 'Holiday 2', date: '2025-05-15' },
        { name: 'Holiday 3', date: '2025-06-01' },
      ];

      const response = await request(app)
        .post('/api/holidays/bulk')
        .set(authHeader)
        .send({ holidays });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.holidays.length).toBe(3);
    });

    it('should reject empty holidays array', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/holidays/bulk')
        .set(authHeader)
        .send({ holidays: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/holidays/:id', () => {
    let testHolidayId: number;

    beforeEach(async () => {
      const holiday = await Holiday.create({
        name: 'Original Name',
        date: new Date('2025-07-04'),
        year: 2025,
        isOptional: false,
      });
      testHolidayId = holiday.id;
    });

    it('should allow admin to update holiday', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/holidays/${testHolidayId}`)
        .set(authHeader)
        .send({ name: 'Updated Holiday Name' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.holiday.name).toBe('Updated Holiday Name');
    });

    it('should return 404 for non-existent holiday', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put('/api/holidays/99999')
        .set(authHeader)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should reject update by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .put(`/api/holidays/${testHolidayId}`)
        .set(authHeader)
        .send({ name: 'Updated' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/holidays/:id', () => {
    let testHolidayId: number;

    beforeEach(async () => {
      const holiday = await Holiday.create({
        name: 'Deletable Holiday',
        date: new Date('2025-09-01'),
        year: 2025,
        isOptional: false,
      });
      testHolidayId = holiday.id;
    });

    it('should allow admin to delete holiday', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete(`/api/holidays/${testHolidayId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent holiday', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete('/api/holidays/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should reject deletion by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .delete(`/api/holidays/${testHolidayId}`)
        .set(authHeader);

      expect(response.status).toBe(403);
    });
  });
});
