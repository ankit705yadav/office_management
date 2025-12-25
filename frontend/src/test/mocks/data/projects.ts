export const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  ownerId: 2,
  departmentId: 1,
  clientId: 1,
  createdBy: 1,
  createdAt: '2025-01-01T00:00:00.000Z',
  owner: {
    id: 2,
    firstName: 'Manager',
    lastName: 'User',
  },
  department: {
    id: 1,
    name: 'Engineering',
  },
  client: {
    id: 1,
    name: 'Test Client',
  },
};

export const mockTask = {
  id: 1,
  projectId: 1,
  taskCode: 'TP-001',
  title: 'Test Task',
  description: 'A test task description',
  status: 'todo',
  priority: 'medium',
  assigneeId: 3,
  createdBy: 2,
  dueDate: '2025-01-20',
  estimatedHours: 8,
  tags: ['frontend', 'bug'],
  createdAt: '2025-01-10T10:00:00.000Z',
  project: {
    id: 1,
    name: 'Test Project',
    departmentId: 1,
    status: 'active',
  },
  assignee: {
    id: 3,
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@test.com',
    profileImageUrl: null,
  },
  creator: {
    id: 2,
    firstName: 'Manager',
    lastName: 'User',
  },
  attachments: [],
};

export const mockTasks = [
  mockTask,
  {
    ...mockTask,
    id: 2,
    taskCode: 'TP-002',
    title: 'Another Task',
    status: 'in_progress',
  },
  {
    ...mockTask,
    id: 3,
    taskCode: 'TP-003',
    title: 'Completed Task',
    status: 'done',
  },
];

export const mockProjects = [mockProject];
