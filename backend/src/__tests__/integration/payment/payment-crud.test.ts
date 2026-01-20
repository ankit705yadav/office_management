import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, PaymentStatus } from '../../../types/enums';
import { EmployeeSalary, Payment } from '../../../models';

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

describe('Payment Operations', () => {
  let testData: TestData;
  let testSalary: EmployeeSalary;

  beforeAll(async () => {
    testData = await seedTestData();

    // Create a salary record for testing
    testSalary = await EmployeeSalary.create({
      userId: testData.employee.id,
      basicSalary: 50000,
      effectiveFrom: new Date('2025-01-01'),
      createdBy: testData.admin.id,
    });
  });

  afterAll(async () => {
    await Payment.destroy({ where: {} });
    await EmployeeSalary.destroy({ where: {} });
    await cleanupTestData();
  });

  describe('POST /api/payments/salaries', () => {
    it('should allow admin to set salary', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/payments/salaries')
        .set(authHeader)
        .send({
          userId: testData.manager.id,
          basicSalary: 75000,
          effectiveFrom: '2025-02-01',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.salary).toBeDefined();
    });

    it('should reject salary setting for non-existent user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/payments/salaries')
        .set(authHeader)
        .send({
          userId: 99999,
          basicSalary: 50000,
          effectiveFrom: '2025-01-01',
        });

      expect(response.status).toBe(404);
    });

    it('should reject salary setting by non-admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/payments/salaries')
        .set(authHeader)
        .send({
          userId: testData.employee.id,
          basicSalary: 50000,
          effectiveFrom: '2025-01-01',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/payments/salaries', () => {
    it('should return all salaries for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/payments/salaries')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.salaries).toBeDefined();
    });

    it('should reject access by non-admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/payments/salaries')
        .set(authHeader);

      expect(response.status).toBe(403);
    });

    it('should paginate results', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/payments/salaries')
        .query({ page: 1, limit: 10 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/payments/salaries/:userId', () => {
    it('should return salary for specific user', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/payments/salaries/${testData.employee.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for user without salary', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/payments/salaries/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/payments/my-salary', () => {
    it('should return own salary for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/payments/my-salary')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/payments/my-salary');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/payments/run-payroll', () => {
    it('should allow admin to run payroll', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/payments/run-payroll')
        .set(authHeader)
        .send({
          month: 1,
          year: 2025,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.paymentsCreated).toBeDefined();
    });

    it('should handle duplicate payroll run', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      // First run
      await request(app)
        .post('/api/payments/run-payroll')
        .set(authHeader)
        .send({ month: 2, year: 2025 });

      // Second run should handle duplicates
      const response = await request(app)
        .post('/api/payments/run-payroll')
        .set(authHeader)
        .send({ month: 2, year: 2025 });

      expect(response.status).toBe(200);
    });

    it('should reject payroll run by non-admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .post('/api/payments/run-payroll')
        .set(authHeader)
        .send({ month: 3, year: 2025 });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      // Create test payment
      await Payment.create({
        userId: testData.employee.id,
        salaryId: testSalary.id,
        paymentMonth: 1,
        paymentYear: 2025,
        amount: 50000,
        status: PaymentStatus.PENDING,
      });
    });

    it('should return all payments for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/payments')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payments).toBeDefined();
    });

    it('should filter by month and year', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/payments')
        .query({ month: 1, year: 2025 })
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
        .get('/api/payments')
        .query({ status: 'pending' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/payments/:id', () => {
    let testPaymentId: number;

    beforeEach(async () => {
      const payment = await Payment.create({
        userId: testData.employee.id,
        salaryId: testSalary.id,
        paymentMonth: 3,
        paymentYear: 2025,
        amount: 50000,
        status: PaymentStatus.PENDING,
      });
      testPaymentId = payment.id;
    });

    it('should allow admin to update payment status', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/payments/${testPaymentId}`)
        .set(authHeader)
        .send({ status: PaymentStatus.PAID });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent payment', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put('/api/payments/99999')
        .set(authHeader)
        .send({ status: PaymentStatus.PAID });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/payments/my-payments', () => {
    it('should return own payments for employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/payments/my-payments')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payments).toBeDefined();
    });

    it('should filter by year', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .get('/api/payments/my-payments')
        .query({ year: 2025 })
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/payments/employees-without-salary', () => {
    it('should return employees without salary setup', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/payments/employees-without-salary')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.users).toBeDefined();
    });
  });
});
