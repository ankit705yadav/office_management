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
import { Close, Save, Warning, Link as LinkIcon } from '@mui/icons-material';
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
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (open) {
      loadProjects();
      loadUsers();
      if (task) {
        setFormData({
          projectId: task.projectId,
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          assigneeId: task.assigneeId || null,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          estimatedHours: task.estimatedHours?.toString() || '',
          tags: task.tags || [],
          attachmentUrl: (task as any).attachmentUrl || '',
        });
      } else {
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
        });
      }
    }
  }, [open, task, defaultProjectId]);

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
      const response = await api.get('/users', { params: { status: 'active', limit: 100 } });
      // API returns { status: 'success', data: { users: [...] } }
      setUsers(response.data?.data?.users || response.data?.users || response.data?.items || []);
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

    try {
      setLoading(true);

      let savedTask: Task;

      if (task) {
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
        } as any;
        savedTask = await projectService.updateTask(task.id, data);
        toast.success('Task updated successfully');
      } else {
        const data: CreateTaskRequest = {
          projectId: formData.projectId!,
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status as any,
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
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
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

        {task?.assigneeOnLeave && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            The assignee is currently on leave
          </Alert>
        )}

        {task?.isOverdue && (
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
            disabled={viewOnly}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            disabled={viewOnly}
            sx={{ mb: 2 }}
          />

          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            value={selectedAssignee}
            onChange={(_, newValue) => setFormData({ ...formData, assigneeId: newValue?.id || null })}
            disabled={viewOnly}
            renderInput={(params) => <TextField {...params} label="Assignee" />}
            sx={{ mb: 2 }}
          />

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
                disabled={viewOnly}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={viewOnly}
            />
            <TextField
              fullWidth
              label="Estimated Hours"
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              disabled={viewOnly}
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
                  onDelete={viewOnly ? undefined : () => handleRemoveTag(tag)}
                />
              ))}
            </Box>
            {!viewOnly && (
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

          {/* Attachment Link */}
          <TextField
            fullWidth
            label="Attachment Link"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
            disabled={viewOnly}
            placeholder="https://drive.google.com/..."
            InputProps={{
              startAdornment: <LinkIcon sx={{ mr: 1, color: 'var(--text-muted)' }} />,
            }}
            sx={{ mb: 3 }}
          />

          {/* Task Meta */}
          {task && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              {task.creator && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Created by: {task.creator.firstName} {task.creator.lastName}
                </Typography>
              )}
              {task.createdAt && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                </Typography>
              )}
              {task.updatedAt && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Updated: {format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm')}
                </Typography>
              )}
            </Paper>
          )}

          {!viewOnly && (
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
