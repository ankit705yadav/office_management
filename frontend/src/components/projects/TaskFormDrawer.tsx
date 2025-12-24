import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Autocomplete,
  CircularProgress,
  Chip,
  Paper,
  Alert,
} from '@mui/material';
import { Close, Save, Warning, Link as LinkIcon, ExpandMore } from '@mui/icons-material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import TaskComments from './TaskComments';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  projectService,
  Task,
  Project,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../services/project.service';
import api from '../../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskFormDrawerProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  defaultProjectId?: number;
  viewOnly?: boolean;
  onSaved: () => void;
}

const TaskFormDrawer: React.FC<TaskFormDrawerProps> = ({
  open,
  onClose,
  task,
  defaultProjectId,
  viewOnly = false,
  onSaved,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fullTask, setFullTask] = useState<Task | null>(null); // Full task data with dependencies
  const [formData, setFormData] = useState({
    projectId: defaultProjectId || null as number | null,
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: null as number | null,
    dueDate: '',
    estimatedHours: '',
    tags: [] as string[],
    attachmentUrl: '',
    blockReason: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [blockingDependencies, setBlockingDependencies] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  // Role-based permissions - use fullTask for accurate data
  const currentTask = fullTask || task;
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const isAssignee = currentTask?.assigneeId === user?.id;
  const canEditAllFields = isAdminOrManager || !task; // New tasks or admin/manager
  const canEditTask = canEditAllFields || isAssignee;

  // Fetch full task data including dependencies
  const loadFullTask = async (taskId: number) => {
    try {
      const taskData = await projectService.getTaskById(taskId);
      setFullTask(taskData);
      return taskData;
    } catch (error) {
      console.error('Error loading task:', error);
      return null;
    }
  };

  useEffect(() => {
    if (open) {
      loadProjects();
      loadUsers();
      if (task) {
        // Fetch full task data to get dependencies
        loadFullTask(task.id).then((fetchedTask) => {
          const taskData = fetchedTask || task;
          const taskTags = taskData.tags || [];
          setFormData({
            projectId: taskData.projectId,
            title: taskData.title || '',
            description: taskData.description || '',
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            assigneeId: taskData.assigneeId || null,
            dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : '',
            estimatedHours: taskData.estimatedHours?.toString() || '',
            tags: taskTags,
            attachmentUrl: (taskData as any).attachmentUrl || '',
            blockReason: taskData.blockReason || '',
          });
          setOriginalTags(taskTags);
          // Initialize blocking dependencies from existing task dependencies
          setBlockingDependencies(taskData.dependencies || []);
          // Load available tasks for blocking
          loadAvailableTasks(taskData.projectId);
        });
      } else {
        setFullTask(null);
        setFormData({
          projectId: defaultProjectId || null,
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assigneeId: null,
          dueDate: '',
          estimatedHours: '',
          tags: [],
          attachmentUrl: '',
          blockReason: '',
        });
        setOriginalTags([]);
        setBlockingDependencies([]);
        setAvailableTasks([]);
      }
    } else {
      setFullTask(null);
    }
  }, [open, task, defaultProjectId]);

  const loadAvailableTasks = async (projectId: number) => {
    try {
      const response = await projectService.getAllTasks({ projectId, limit: 100 });
      // Filter out current task
      setAvailableTasks(response.items.filter((t) => t.id !== task?.id));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects({ status: 'active', limit: 100 });
      setProjects(response.items);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Use list-basic endpoint that all users can access
      const response = await api.get('/users/list-basic', { params: { status: 'active' } });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;

    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!task && !formData.projectId) {
      toast.error('Please select a project');
      return;
    }

    // Validate blocking requirements when status is blocked
    if (formData.status === 'blocked' && task) {
      const hasBlockingDeps = blockingDependencies.length > 0;
      const hasBlockReason = formData.blockReason.trim().length > 0;

      if (!hasBlockingDeps && !hasBlockReason) {
        toast.error('To block a task, select blocking tasks or provide a reason');
        return;
      }
    }

    try {
      setLoading(true);

      let savedTask: Task;

      if (task) {
        // Handle blocked status - sync dependencies
        if (formData.status === 'blocked') {
          const currentDepIds = new Set((currentTask?.dependencies || []).map((d) => d.id));
          const newDepIds = new Set(blockingDependencies.map((d) => d.id));

          // Find dependencies to add
          const toAdd = blockingDependencies.filter((d) => !currentDepIds.has(d.id)).map((d) => d.id);
          // Find dependencies to remove
          const toRemove = (currentTask?.dependencies || []).filter((d) => !newDepIds.has(d.id)).map((d) => d.id);

          // Add new dependencies
          if (toAdd.length > 0) {
            await projectService.addTaskDependencies(task.id, toAdd);
          }

          // Remove deleted dependencies
          for (const depId of toRemove) {
            await projectService.removeTaskDependency(task.id, depId);
          }

          // Update task status if changing to blocked
          if (currentTask?.status !== 'blocked') {
            await projectService.updateTaskStatus(task.id, 'blocked', {
              blockReason: formData.blockReason || undefined,
            });
          }
        }

        // Update task fields
        const data: UpdateTaskRequest = {
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status as any,
          priority: formData.priority as any,
          assigneeId: formData.assigneeId,
          dueDate: formData.dueDate || null,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          tags: formData.tags,
          attachmentUrl: formData.attachmentUrl || undefined,
          blockReason: formData.status === 'blocked' ? (formData.blockReason || null) : null,
        } as any;
        savedTask = await projectService.updateTask(task.id, data);
        toast.success('Task updated successfully');
      } else {
        // New task - don't allow blocked status on creation
        const createStatus = formData.status === 'blocked' ? 'todo' : formData.status;
        const data: CreateTaskRequest = {
          projectId: formData.projectId!,
          title: formData.title,
          description: formData.description || undefined,
          status: createStatus as any,
          priority: formData.priority as any,
          assigneeId: formData.assigneeId || undefined,
          dueDate: formData.dueDate || undefined,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          tags: formData.tags,
          attachmentUrl: formData.attachmentUrl || undefined,
        } as any;
        savedTask = await projectService.createTask(data);
        toast.success('Task created successfully');
      }

      onSaved();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    // Assignees can only remove tags they added (not original tags)
    if (!canEditAllFields && originalTags.includes(tag)) {
      return; // Assignee cannot remove original tags
    }
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  // Check if a tag can be deleted by the current user
  const canDeleteTag = (tag: string) => {
    if (viewOnly) return false;
    if (canEditAllFields) return true; // Admin/manager can delete any tag
    // Assignee can only delete tags they added (not in originalTags)
    return !originalTags.includes(tag);
  };

  const selectedAssignee = users.find((u) => u.id === formData.assigneeId) || null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {viewOnly ? 'View Task' : task ? 'Edit Task' : 'New Task'}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {currentTask?.assigneeOnLeave && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            The assignee is currently on leave
          </Alert>
        )}

        {currentTask?.isOverdue && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This task is overdue
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {!task && (
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Project</InputLabel>
              <Select
                value={formData.projectId || ''}
                label="Project"
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value as number })}
                disabled={viewOnly || !!defaultProjectId}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {task && (
            <TextField
              fullWidth
              label="Project"
              value={task.project?.name || ''}
              disabled
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={viewOnly || !canEditAllFields}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            disabled={viewOnly || !canEditAllFields}
            sx={{ mb: 2 }}
          />

          {/* Assignee field - hidden for assignees, only visible to admin/manager */}
          {canEditAllFields ? (
            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              value={selectedAssignee}
              onChange={(_, newValue) => setFormData({ ...formData, assigneeId: newValue?.id || null })}
              disabled={viewOnly}
              renderInput={(params) => <TextField {...params} label="Assignee" />}
              sx={{ mb: 2 }}
            />
          ) : task?.assignee ? (
            <TextField
              fullWidth
              label="Assignee"
              value={`${task.assignee.firstName} ${task.assignee.lastName}`}
              disabled
              sx={{ mb: 2 }}
            />
          ) : null}

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={viewOnly}
              >
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                {/* Blocked status only available for existing tasks or when already blocked */}
                {(task || formData.status === 'blocked') && <MenuItem value="blocked">Blocked</MenuItem>}
                <MenuItem value="done">Done</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={viewOnly || !canEditAllFields}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Blocking Section - shown when status is blocked */}
          {formData.status === 'blocked' && currentTask && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'error.lighter' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'error.main' }}>
                Blocking Information
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Specify blocking tasks and/or provide a reason
              </Typography>

              {/* Blocking Tasks - editable */}
              <Autocomplete
                multiple
                options={availableTasks}
                getOptionLabel={(option) =>
                  `${option.taskCode || `#${option.id}`}: ${option.title}`
                }
                value={blockingDependencies}
                onChange={(_, newValue) => setBlockingDependencies(newValue)}
                disabled={viewOnly}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Chip
                        size="small"
                        label={option.status === 'done' || option.status === 'approved' ? '✓' : '○'}
                        color={option.status === 'done' || option.status === 'approved' ? 'success' : 'default'}
                        sx={{ minWidth: 28 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {option.taskCode || `#${option.id}`}: {option.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.status} {option.assignee ? `• ${option.assignee.firstName} ${option.assignee.lastName}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      size="small"
                      label={`${option.taskCode || `#${option.id}`}: ${option.title.substring(0, 20)}${option.title.length > 20 ? '...' : ''}`}
                      color={option.status === 'done' || option.status === 'approved' ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Blocking Tasks"
                    placeholder="Select tasks that are blocking this one..."
                  />
                )}
                sx={{ mb: 2 }}
              />

              {/* Block Reason */}
              <TextField
                fullWidth
                size="small"
                label="Block Reason"
                value={formData.blockReason}
                onChange={(e) => setFormData({ ...formData, blockReason: e.target.value })}
                placeholder="e.g., Waiting for client approval, external dependency..."
                multiline
                rows={2}
                disabled={viewOnly}
              />
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={viewOnly || !canEditAllFields}
            />
            <TextField
              fullWidth
              label="Estimated Hours"
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              disabled={viewOnly || !canEditAllFields}
            />
          </Box>

          {/* Tags */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={canDeleteTag(tag) ? () => handleRemoveTag(tag) : undefined}
                  variant={originalTags.includes(tag) && !canEditAllFields ? 'outlined' : 'filled'}
                />
              ))}
            </Box>
            {!viewOnly && canEditTask && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button size="small" onClick={handleAddTag}>
                  Add
                </Button>
              </Box>
            )}
          </Box>

          {/* Attachment Link - only editable by admin/manager */}
          <TextField
            fullWidth
            label="Attachment Link"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
            disabled={viewOnly || !canEditAllFields}
            placeholder="https://drive.google.com/..."
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: 'var(--text-muted)' }} />,
            }}
            sx={{ mb: 3 }}
          />

          {/* Task Meta */}
          {currentTask && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              {currentTask.creator && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Created by: {currentTask.creator.firstName} {currentTask.creator.lastName}
                </Typography>
              )}
              {currentTask.createdAt && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {format(new Date(currentTask.createdAt), 'MMM dd, yyyy HH:mm')}
                </Typography>
              )}
              {currentTask.updatedAt && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Updated: {format(new Date(currentTask.updatedAt), 'MMM dd, yyyy HH:mm')}
                </Typography>
              )}
            </Paper>
          )}

          {/* Comments Section */}
          {currentTask && (
            <Accordion sx={{ mb: 2 }} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">
                  Comments {currentTask.commentCount ? `(${currentTask.commentCount})` : ''}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TaskComments
                  taskId={currentTask.id}
                  canComment={
                    user?.role === 'admin' ||
                    user?.role === 'manager' ||
                    currentTask.assigneeId === user?.id ||
                    currentTask.createdBy === user?.id
                  }
                />
              </AccordionDetails>
            </Accordion>
          )}

          {!viewOnly && canEditTask && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                disabled={loading}
              >
                {task ? 'Update' : 'Create'}
              </Button>
            </Box>
          )}
        </form>
      </Box>
    </Drawer>
  );
};

export default TaskFormDrawer;
