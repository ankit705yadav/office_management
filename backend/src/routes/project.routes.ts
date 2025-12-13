import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getTasksAtRiskDueToLeave,
  getProjectHierarchy,
  createProjectWithCode,
  moveProject,
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

// Ensure upload directories exist
const taskUploadsDir = path.join(__dirname, '../../uploads/tasks');
if (!fs.existsSync(taskUploadsDir)) {
  fs.mkdirSync(taskUploadsDir, { recursive: true });
}

// Configure multer for task attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, taskUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `task-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// ==================== Project Routes ====================

// Get project statistics/dashboard
router.get('/stats', getProjectStats);

// Get tasks at risk due to leave
router.get('/tasks-at-risk', getTasksAtRiskDueToLeave);

// Get project hierarchy (tree structure)
router.get('/hierarchy', getProjectHierarchy);

// Check assignee leave status
router.get('/check-leave/:userId', checkAssigneeLeave);

// Get all projects
router.get('/', getAllProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Get tasks for Kanban board
router.get('/:id/board', getTasksForBoard);

// Create project with auto-generated code (admin/manager only)
router.post('/', authorize(['admin', 'manager']), createProjectWithCode);

// Update project (admin/manager only)
router.put('/:id', authorize(['admin', 'manager']), updateProject);

// Move project to different parent (admin/manager only)
router.put('/:id/move', authorize(['admin', 'manager']), moveProject);

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

// Task attachments
router.post('/tasks/:id/attachments', upload.array('files', 5), addTaskAttachment);
router.delete('/tasks/:id/attachments/:attachmentId', deleteTaskAttachment);

export default router;
