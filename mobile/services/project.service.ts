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
};

export default projectService;
