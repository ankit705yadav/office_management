// Project & Task API service

import api from './api';
import { Task, PaginatedResponse } from '../types';

export const projectService = {
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
  getTasks: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    projectId?: number;
    assigneeId?: number;
    myTasks?: boolean;
    overdue?: boolean;
  }): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/projects/tasks/list', { params });
    return response.data;
  },
};

export default projectService;
