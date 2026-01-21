// Project & Task API service

import api from './api';
import {
  Task,
  Project,
  PaginatedResponse,
  ProjectStats,
  TaskReportsResponse,
  CreateTaskData,
  UpdateTaskData,
  User,
  Department,
  Client,
  TaskAttachment,
  TaskAttachmentInput,
  TaskComment,
} from '../types';

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  projectId?: number;
  assigneeId?: number;
  myTasks?: boolean;
  overdue?: boolean;
  search?: string;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

// Project CRUD types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  departmentId?: number;
  ownerId?: number;
  clientId?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  attachmentUrl?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
}

export const projectService = {
  // ============================================
  // PROJECTS
  // ============================================

  /**
   * Get all projects with filters
   */
  getProjects: async (params?: ProjectFilters): Promise<PaginatedResponse<Project>> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  /**
   * Get project by ID
   */
  getProjectById: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  /**
   * Get project statistics/dashboard
   */
  getProjectStats: async (): Promise<ProjectStats> => {
    const response = await api.get('/projects/stats');
    return response.data;
  },

  /**
   * Create a new project
   */
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data?.data?.project || response.data?.data || response.data;
  },

  /**
   * Update an existing project
   */
  updateProject: async (id: number, data: UpdateProjectRequest): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data?.data?.project || response.data?.data || response.data;
  },

  /**
   * Delete a project
   */
  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  /**
   * Get departments for project form
   */
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/users/departments');
    return response.data?.data?.departments || [];
  },

  /**
   * Get clients for project form
   */
  getClients: async (): Promise<Client[]> => {
    const response = await api.get('/clients', { params: { limit: 100, status: 'active' } });
    return response.data?.data?.clients || [];
  },

  // ============================================
  // TASKS
  // ============================================

  /**
   * Get user's tasks
   * @param params - Query params (myTasks, status, limit, etc.)
   */
  getMyTasks: async (limit = 10): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/projects/tasks/list', {
      params: { myTasks: true, limit },
    });
    return response.data;
  },

  /**
   * Get all tasks with optional filters
   */
  getTasks: async (params?: TaskFilters): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/projects/tasks/list', { params });
    return response.data;
  },

  /**
   * Get task by ID
   */
  getTaskById: async (id: number): Promise<Task> => {
    const response = await api.get(`/projects/tasks/${id}`);
    return response.data;
  },

  /**
   * Create a new task
   */
  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post('/projects/tasks', data);
    return response.data;
  },

  /**
   * Update a task
   */
  updateTask: async (id: number, data: UpdateTaskData): Promise<Task> => {
    const response = await api.put(`/projects/tasks/${id}`, data);
    return response.data;
  },

  /**
   * Update task status (quick update)
   */
  updateTaskStatus: async (
    id: number,
    status: string,
    blockReason?: string
  ): Promise<Task> => {
    const response = await api.patch(`/projects/tasks/${id}/status`, {
      status,
      blockReason,
    });
    return response.data;
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/projects/tasks/${id}`);
  },

  // ============================================
  // REPORTS (Admin/Manager only)
  // ============================================

  /**
   * Get task reports per user
   */
  getTaskReports: async (params?: {
    projectId?: number;
    userId?: number;
  }): Promise<TaskReportsResponse> => {
    const response = await api.get('/projects/reports', { params });
    return response.data;
  },

  // ============================================
  // USERS (for assignee selection)
  // ============================================

  /**
   * Get users for task assignment
   */
  getUsers: async (params?: { search?: string; limit?: number }): Promise<User[]> => {
    const response = await api.get('/users', { params: { ...params, limit: params?.limit || 50 } });
    // Backend returns { status: 'success', data: { users: [...], pagination: {...} } }
    return response.data?.data?.users || response.data?.users || response.data?.items || [];
  },

  // ============================================
  // TASK ATTACHMENTS
  // ============================================

  /**
   * Add attachments to a task (must be called after task creation)
   */
  addTaskAttachments: async (taskId: number, links: TaskAttachmentInput[]): Promise<TaskAttachment[]> => {
    const response = await api.post(`/projects/tasks/${taskId}/attachments`, { links });
    return response.data?.data?.attachments || response.data?.attachments || response.data || [];
  },

  // ============================================
  // TASK COMMENTS
  // ============================================

  /**
   * Get comments for a task
   */
  getTaskComments: async (taskId: number): Promise<TaskComment[]> => {
    const response = await api.get(`/projects/tasks/${taskId}/comments`);
    return response.data?.data?.comments || response.data?.comments || response.data || [];
  },

  /**
   * Create a comment on a task
   */
  createTaskComment: async (taskId: number, content: string, parentId?: number): Promise<TaskComment> => {
    const response = await api.post(`/projects/tasks/${taskId}/comments`, { content, parentId });
    return response.data?.data?.comment || response.data?.comment || response.data;
  },

  /**
   * Update a task comment
   */
  updateTaskComment: async (taskId: number, commentId: number, content: string): Promise<TaskComment> => {
    const response = await api.put(`/projects/tasks/${taskId}/comments/${commentId}`, { content });
    return response.data?.data?.comment || response.data?.comment || response.data;
  },

  /**
   * Delete a task comment
   */
  deleteTaskComment: async (taskId: number, commentId: number): Promise<void> => {
    await api.delete(`/projects/tasks/${taskId}/comments/${commentId}`);
  },
};

export default projectService;
