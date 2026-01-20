import request from 'supertest';
import app from '../../../app';
import { seedTestData, cleanupTestData, TestData } from '../../utils/database';
import { getAuthHeader } from '../../utils/auth.helper';
import { UserRole, ProjectStatus, TaskStatus } from '../../../types/enums';
import { Project, Task } from '../../../models';

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

describe('Project CRUD Operations', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/projects', () => {
    it('should return projects for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/projects')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should return projects for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/projects')
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
        .get('/api/projects')
        .query({ status: 'active' })
        .set(authHeader);

      expect(response.status).toBe(200);
    });

    it('should filter by search term', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/projects')
        .query({ search: 'test' })
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
        .get('/api/projects')
        .query({ page: 1, limit: 10 })
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project by id', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/projects/${testData.project.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testData.project.id);
    });

    it('should return 404 for non-existent project', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/projects/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should include task counts', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/projects/${testData.project.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.taskCounts).toBeDefined();
    });
  });

  describe('POST /api/projects', () => {
    it('should allow admin to create project', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const newProject = {
        name: `Test Project ${Date.now()}`,
        description: 'Test description',
        departmentId: testData.department.id,
        priority: 'high',
      };

      const response = await request(app)
        .post('/api/projects')
        .set(authHeader)
        .send(newProject);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newProject.name);
      expect(response.body.status).toBe(ProjectStatus.ACTIVE);
    });

    it('should allow manager to create project', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const newProject = {
        name: `Manager Project ${Date.now()}`,
        description: 'Created by manager',
      };

      const response = await request(app)
        .post('/api/projects')
        .set(authHeader)
        .send(newProject);

      expect(response.status).toBe(201);
    });

    it('should reject project without name', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .post('/api/projects')
        .set(authHeader)
        .send({ description: 'No name' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should reject project creation by employee', async () => {
      const authHeader = getAuthHeader({
        id: testData.employee.id,
        email: testData.employee.email,
        role: UserRole.EMPLOYEE,
      });

      const response = await request(app)
        .post('/api/projects')
        .set(authHeader)
        .send({ name: 'Employee Project' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should allow admin to update project', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set(authHeader)
        .send({ description: 'Updated description' });

      expect(response.status).toBe(200);
    });

    it('should allow changing project status', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set(authHeader)
        .send({ status: ProjectStatus.ON_HOLD });

      expect(response.status).toBe(200);

      // Restore status
      await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set(authHeader)
        .send({ status: ProjectStatus.ACTIVE });
    });

    it('should return 404 for non-existent project', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .put('/api/projects/99999')
        .set(authHeader)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let deletableProjectId: number;

    beforeEach(async () => {
      // Create a project without tasks
      const project = await Project.create({
        name: `Deletable Project ${Date.now()}`,
        description: 'To be deleted',
        status: ProjectStatus.ACTIVE,
        ownerId: testData.manager.id,
        createdBy: testData.admin.id,
      });
      deletableProjectId = project.id;
    });

    it('should allow admin to delete project without tasks', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete(`/api/projects/${deletableProjectId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should reject deletion of project with tasks', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      // Create a task for the project
      await Task.create({
        projectId: deletableProjectId,
        title: 'Test Task',
        status: TaskStatus.TODO,
        taskCode: 'T-001',
        createdBy: testData.admin.id,
      });

      const response = await request(app)
        .delete(`/api/projects/${deletableProjectId}`)
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing tasks');
    });

    it('should return 404 for non-existent project', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .delete('/api/projects/99999')
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/projects/:id/board', () => {
    it('should return Kanban board data', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get(`/api/projects/${testData.project.id}/board`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.todo).toBeDefined();
      expect(response.body.in_progress).toBeDefined();
      expect(response.body.done).toBeDefined();
    });

    it('should return 404 for non-existent project', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/projects/99999/board')
        .set(authHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/projects/stats', () => {
    it('should return project statistics for admin', async () => {
      const authHeader = getAuthHeader({
        id: testData.admin.id,
        email: testData.admin.email,
        role: UserRole.ADMIN,
      });

      const response = await request(app)
        .get('/api/projects/stats')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.projectsByStatus).toBeDefined();
      expect(response.body.tasksByStatus).toBeDefined();
    });

    it('should return project statistics for manager', async () => {
      const authHeader = getAuthHeader({
        id: testData.manager.id,
        email: testData.manager.email,
        role: UserRole.MANAGER,
      });

      const response = await request(app)
        .get('/api/projects/stats')
        .set(authHeader);

      expect(response.status).toBe(200);
    });
  });
});
