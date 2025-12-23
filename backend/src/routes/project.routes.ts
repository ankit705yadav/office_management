import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getTasksAtRiskDueToLeave,
  getTasksForBoard,
  reorderTasks,
  checkAssigneeLeave,
  createTaskWithCode,
} from '../controllers/project.controller';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addTaskAttachment,
  deleteTaskAttachment,
  getTasksByUser,
} from '../controllers/task.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== Project Routes ====================

// Get project statistics/dashboard
router.get('/stats', getProjectStats);

// Get tasks at risk due to leave
router.get('/tasks-at-risk', getTasksAtRiskDueToLeave);

// Check assignee leave status
router.get('/check-leave/:userId', checkAssigneeLeave);

// Get all projects
router.get('/', getAllProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Get tasks for Kanban board
router.get('/:id/board', getTasksForBoard);

// Create project (admin/manager only)
router.post('/', authorize(['admin', 'manager']), createProject);

// Update project (admin/manager only)
router.put('/:id', authorize(['admin', 'manager']), updateProject);

// Delete project (admin/manager only)
router.delete('/:id', authorize(['admin', 'manager']), deleteProject);

// ==================== Task Routes ====================

// Get tasks by user (for reports)
router.get('/tasks/by-user', getTasksByUser);

// Get all tasks
router.get('/tasks/list', getAllTasks);

// Get task by ID
router.get('/tasks/:id', getTaskById);

// Create task with auto-generated code (admin/manager only)
router.post('/tasks', authorize(['admin', 'manager']), createTaskWithCode);

// Reorder tasks (for Kanban drag-drop)
router.put('/tasks/reorder', reorderTasks);

// Update task (admin/manager or assignee)
router.put('/tasks/:id', updateTask);

// Delete task (admin/manager only)
router.delete('/tasks/:id', authorize(['admin', 'manager']), deleteTask);

// Update task status (anyone assigned or admin/manager)
router.patch('/tasks/:id/status', updateTaskStatus);

// Task attachments (link-based)
router.post('/tasks/:id/attachments', addTaskAttachment);
router.delete('/tasks/:id/attachments/:attachmentId', deleteTaskAttachment);

export default router;
