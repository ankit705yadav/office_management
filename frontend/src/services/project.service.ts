import api from './api';

// Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  ownerId?: number;
  clientId?: number;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  attachmentUrl?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  client?: {
    id: number;
    name: string;
    email?: string;
  };
  taskCounts?: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    approved: number;
  };
  progress?: number;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'approved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: number;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  // New fields
  taskCode?: string;
  actionRequired: boolean;
  actualHours: number;
  dependsOnTaskId?: number;
  sortOrder: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
    departmentId?: number;
    status: string;
  };
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  attachments?: TaskAttachment[];
  dependsOn?: Task;
  dependentTasks?: Task[];
  assigneeOnLeave?: boolean;
  isOverdue?: boolean;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy?: number;
  createdAt: string;
  uploader?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

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

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  departmentId?: number;
  ownerId?: number;
  clientId?: number;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  attachmentUrl?: string;
}

export interface CreateTaskRequest {
  projectId: number;
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'approved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: number;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  // New fields
  taskCode?: string; // Optional override for auto-generated code
  actionRequired?: boolean;
  dependsOnTaskId?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'approved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: number | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  tags?: string[];
  // New fields
  taskCode?: string;
  actionRequired?: boolean;
  actualHours?: number;
  dependsOnTaskId?: number | null;
  sortOrder?: number;
}

export interface ProjectStats {
  projectsByStatus: {
    active?: number;
    completed?: number;
    on_hold?: number;
    cancelled?: number;
  };
  tasksByStatus: {
    todo?: number;
    in_progress?: number;
    approved?: number;
    done?: number;
  };
  overdueTasks: number;
  myTasks: number;
  myOverdueTasks: number;
  tasksDueThisWeek: number;
}

export interface TasksAtRisk {
  tasksAtRisk: Task[];
  usersOnLeave: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    leaves: Array<{
      userId: number;
      startDate: string;
      endDate: string;
    }>;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  departmentId?: number;
  priority?: string;
}

export interface TaskFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  projectId?: number;
  assigneeId?: number;
  overdue?: boolean;
  myTasks?: boolean;
}

// Board/Kanban types
export interface BoardData {
  todo: Task[];
  in_progress: Task[];
  approved: Task[];
  done: Task[];
}

export interface ReorderTaskItem {
  id: number;
  status: 'todo' | 'in_progress' | 'done' | 'approved';
  sortOrder: number;
}

export interface AssigneeLeaveStatus {
  onLeave: boolean;
  currentLeaves: Array<{
    startDate: string;
    endDate: string;
    leaveType: string;
  }>;
  upcomingLeaves: Array<{
    startDate: string;
    endDate: string;
    leaveType: string;
  }>;
}

// Service class
class ProjectService {
  // Project endpoints
  async getAllProjects(params?: ProjectFilterParams): Promise<PaginatedResponse<Project>> {
    const response = await api.get('/projects', { params });
    return response.data;
  }

  async getProjectById(id: number): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  }

  async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  }

  async getProjectStats(): Promise<ProjectStats> {
    const response = await api.get('/projects/stats');
    return response.data;
  }

  async getTasksAtRisk(): Promise<TasksAtRisk> {
    const response = await api.get('/projects/tasks-at-risk');
    return response.data;
  }

  // Board/Kanban endpoints
  async getTasksForBoard(projectId: number): Promise<BoardData> {
    const response = await api.get(`/projects/${projectId}/board`);
    return response.data;
  }

  async reorderTasks(tasks: ReorderTaskItem[]): Promise<void> {
    await api.put('/projects/tasks/reorder', { tasks });
  }

  // Leave checking
  async checkAssigneeLeave(userId: number): Promise<AssigneeLeaveStatus> {
    const response = await api.get(`/projects/check-leave/${userId}`);
    return response.data;
  }

  // Task endpoints
  async getAllTasks(params?: TaskFilterParams): Promise<PaginatedResponse<Task>> {
    const response = await api.get('/projects/tasks/list', { params });
    return response.data;
  }

  async getTaskById(id: number): Promise<Task> {
    const response = await api.get(`/projects/tasks/${id}`);
    return response.data;
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await api.post('/projects/tasks', data);
    return response.data;
  }

  async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    const response = await api.put(`/projects/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/projects/tasks/${id}`);
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const response = await api.patch(`/projects/tasks/${id}/status`, { status });
    return response.data;
  }

  async addTaskAttachments(taskId: number, files: File[]): Promise<TaskAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post(`/projects/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteTaskAttachment(taskId: number, attachmentId: number): Promise<void> {
    await api.delete(`/projects/tasks/${taskId}/attachments/${attachmentId}`);
  }

  async getTasksByUser(): Promise<Array<{
    user: { id: number; firstName: string; lastName: string };
    tasks: { total: number; todo: number; in_progress: number; done: number; approved: number };
  }>> {
    const response = await api.get('/projects/tasks/by-user');
    return response.data;
  }
}

export const projectService = new ProjectService();
