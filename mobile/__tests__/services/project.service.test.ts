import { projectService } from '../../services/project.service';
import api from '../../services/api';
import { mockProject, mockTask, mockUser } from '../mocks/handlers';

// Mock the api module
jest.mock('../../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('projectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== PROJECT TESTS =====

  describe('getProjects', () => {
    it('should get projects with pagination', async () => {
      const mockResponse = {
        data: {
          items: [mockProject],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProjects({ page: 1, limit: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/projects', {
        params: { page: 1, limit: 10 },
      });
      expect(result.items).toHaveLength(1);
    });

    it('should filter projects by status', async () => {
      const mockResponse = {
        data: { items: [], pagination: { total: 0 } },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await projectService.getProjects({ status: 'active' });

      expect(mockedApi.get).toHaveBeenCalledWith('/projects', {
        params: { status: 'active' },
      });
    });
  });

  describe('getProjectById', () => {
    it('should get project by ID', async () => {
      const mockResponse = {
        data: mockProject,
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProjectById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/1');
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Project');
    });
  });

  describe('getProjectStats', () => {
    it('should get project statistics', async () => {
      const mockStats = {
        totalProjects: 10,
        activeProjects: 5,
        completedProjects: 3,
        onHoldProjects: 2,
        totalTasks: 50,
        completedTasks: 25,
      };

      const mockResponse = {
        data: mockStats,
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProjectStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/stats');
      expect(result.totalProjects).toBe(10);
    });
  });

  // ===== TASK TESTS =====

  describe('getMyTasks', () => {
    it('should get user tasks', async () => {
      const mockResponse = {
        data: {
          items: [mockTask],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getMyTasks(10);

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/tasks/list', {
        params: { myTasks: true, limit: 10 },
      });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getTasks', () => {
    it('should get tasks with filters', async () => {
      const mockResponse = {
        data: {
          items: [mockTask],
          pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getTasks({
        status: 'todo',
        priority: 'high',
        projectId: 1,
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/tasks/list', {
        params: { status: 'todo', priority: 'high', projectId: 1 },
      });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getTaskById', () => {
    it('should get task by ID', async () => {
      const mockResponse = {
        data: mockTask,
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getTaskById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/tasks/1');
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Task');
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const mockResponse = {
        data: mockTask,
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const taskData = {
        projectId: 1,
        title: 'New Task',
        description: 'Task description',
        status: 'todo',
        priority: 'medium',
      };

      const result = await projectService.createTask(taskData);

      expect(mockedApi.post).toHaveBeenCalledWith('/projects/tasks', taskData);
      expect(result.id).toBe(1);
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      const mockResponse = {
        data: updatedTask,
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await projectService.updateTask(1, { title: 'Updated Task' });

      expect(mockedApi.put).toHaveBeenCalledWith('/projects/tasks/1', { title: 'Updated Task' });
      expect(result.title).toBe('Updated Task');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      const updatedTask = { ...mockTask, status: 'in_progress' };
      const mockResponse = {
        data: updatedTask,
      };

      mockedApi.patch.mockResolvedValue(mockResponse);

      const result = await projectService.updateTaskStatus(1, 'in_progress');

      expect(mockedApi.patch).toHaveBeenCalledWith('/projects/tasks/1/status', {
        status: 'in_progress',
        blockReason: undefined,
      });
      expect(result.status).toBe('in_progress');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await projectService.deleteTask(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/projects/tasks/1');
    });
  });

  // ===== REPORTS TESTS =====

  describe('getTaskReports', () => {
    it('should get task reports', async () => {
      const mockReports = {
        users: [
          {
            user: mockUser,
            taskCount: 5,
            completedCount: 3,
          },
        ],
      };

      const mockResponse = {
        data: mockReports,
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getTaskReports();

      expect(mockedApi.get).toHaveBeenCalledWith('/projects/reports', { params: undefined });
      expect(result.users).toHaveLength(1);
    });
  });

  // ===== USERS TESTS =====

  describe('getUsers', () => {
    it('should get users for assignment', async () => {
      const mockResponse = {
        data: {
          data: {
            users: [mockUser],
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await projectService.getUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: { limit: 50 } });
      expect(result).toHaveLength(1);
    });
  });
});
