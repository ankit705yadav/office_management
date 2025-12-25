import { http, HttpResponse } from 'msw';
import { mockProjects, mockTasks, mockTask } from '../data/projects';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const projectHandlers = [
  // Get all projects
  http.get(`${API_URL}/projects`, () => {
    return HttpResponse.json({
      items: mockProjects,
      pagination: {
        total: mockProjects.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  }),

  // Get project by ID
  http.get(`${API_URL}/projects/:id`, ({ params }) => {
    const { id } = params;
    const project = mockProjects.find((p) => p.id === Number(id));

    if (!project) {
      return HttpResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(project);
  }),

  // Get project board (Kanban)
  http.get(`${API_URL}/projects/:id/board`, () => {
    return HttpResponse.json({
      todo: mockTasks.filter((t) => t.status === 'todo'),
      in_progress: mockTasks.filter((t) => t.status === 'in_progress'),
      done: mockTasks.filter((t) => t.status === 'done'),
      blocked: mockTasks.filter((t) => t.status === 'blocked'),
    });
  }),

  // Get all tasks
  http.get(`${API_URL}/projects/tasks/list`, () => {
    return HttpResponse.json({
      items: mockTasks,
      pagination: {
        page: 1,
        limit: 50,
        total: mockTasks.length,
        totalPages: 1,
      },
    });
  }),

  // Get task by ID
  http.get(`${API_URL}/projects/tasks/:id`, ({ params }) => {
    const { id } = params;
    const task = mockTasks.find((t) => t.id === Number(id));

    if (!task) {
      return HttpResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...task,
      dependencies: [],
      commentCount: 0,
    });
  }),

  // Create task
  http.post(`${API_URL}/projects/tasks`, async ({ request }) => {
    const body = await request.json() as { projectId: number; title: string };

    if (!body.projectId || !body.title) {
      return HttpResponse.json(
        { message: 'Project ID and title are required' },
        { status: 400 }
      );
    }

    const newTask = {
      ...mockTask,
      id: Date.now(),
      taskCode: `TP-${Date.now()}`,
      ...body,
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json(newTask, { status: 201 });
  }),

  // Update task
  http.put(`${API_URL}/projects/tasks/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<typeof mockTask>;

    const task = mockTasks.find((t) => t.id === Number(id));
    if (!task) {
      return HttpResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...task,
      ...body,
    });
  }),

  // Update task status
  http.patch(`${API_URL}/projects/tasks/:id/status`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as { status: string };

    if (!body.status) {
      return HttpResponse.json(
        { message: 'Valid status is required' },
        { status: 400 }
      );
    }

    const task = mockTasks.find((t) => t.id === Number(id));
    if (!task) {
      return HttpResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...task,
      status: body.status,
    });
  }),

  // Delete task
  http.delete(`${API_URL}/projects/tasks/:id`, ({ params }) => {
    const { id } = params;
    const task = mockTasks.find((t) => t.id === Number(id));

    if (!task) {
      return HttpResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ message: 'Task deleted successfully' });
  }),

  // Get task comments
  http.get(`${API_URL}/projects/tasks/:taskId/comments`, () => {
    return HttpResponse.json([]);
  }),

  // Create task comment
  http.post(`${API_URL}/projects/tasks/:taskId/comments`, async ({ params, request }) => {
    const { taskId } = params;
    const body = await request.json() as { content: string };

    if (!body.content) {
      return HttpResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      id: Date.now(),
      taskId: Number(taskId),
      userId: 3,
      content: body.content,
      createdAt: new Date().toISOString(),
      author: {
        id: 3,
        firstName: 'Employee',
        lastName: 'User',
        profileImageUrl: null,
      },
    }, { status: 201 });
  }),
];
