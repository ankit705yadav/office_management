import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole } from '../../../types/enums';
import Client from '../../../models/Client';

// Mock services
jest.mock('../../../services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/socket.service', () => ({
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
}));

describe('Client CRUD Operations', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/clients', () => {
    it('should return all clients for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/clients')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.clients).toBeDefined();
    });

    it('should allow manager to get clients', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/clients')
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should filter by search', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/clients')
        .query({ search: 'test' })
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
        .get('/api/clients')
        .query({ status: 'active' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should paginate results', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/clients')
        .query({ page: 1, limit: 10 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/clients');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return client by id', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/clients/${testData.client.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.client.id).toBe(testData.client.id);
    });

    it('should return 404 for non-existent client', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/clients/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/clients', () => {
    it('should allow admin to create client', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const newClient = {
        name: `New Client ${Date.now()}`,
        email: `client_${Date.now()}@test.com`,
        contactPerson: 'John Doe',
        phone: '1234567890',
      };

      const response = await request(app)
        .post('/api/clients')
        .set(authHeader)
        .send(newClient);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.client.name).toBe(newClient.name);
    });

    it('should allow manager to create client', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const newClient = {
        name: `Manager Client ${Date.now()}`,
        email: `mclient_${Date.now()}@test.com`,
      };

      const response = await request(app)
        .post('/api/clients')
        .set(authHeader)
        .send(newClient);

      expect(response.status).toBe(201);
    });

    it('should reject client without name', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/clients')
        .set(authHeader)
        .send({ email: 'noname@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should reject client creation by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/clients')
        .set(authHeader)
        .send({ name: 'Employee Client' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should allow admin to update client', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/clients/${testData.client.id}`)
        .set(authHeader)
        .send({ name: 'Updated Client Name' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent client', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put('/api/clients/99999')
        .set(authHeader)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    let deletableClientId: number;

    beforeEach(async () => {
      const client = await Client.create({
        name: `Deletable Client ${Date.now()}`,
        email: `del_${Date.now()}@test.com`,
        createdBy: testData.admin.id,
      });
      deletableClientId = client.id;
    });

    it('should allow admin to delete client', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete(`/api/clients/${deletableClientId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent client', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete('/api/clients/99999')
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
        .delete(`/api/clients/${deletableClientId}`)
        .set(authHeader);

      expect(response.status).toBe(403);
    });
  });
});
