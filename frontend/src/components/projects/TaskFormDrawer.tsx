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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Alert,
} from '@mui/material';
import { Close, Save, AttachFile, Delete, CloudUpload, Warning } from '@mui/icons-material';
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
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
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
        });
      }
      setFilesToUpload([]);
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
        };
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
        };
        savedTask = await projectService.createTask(data);
        toast.success('Task created successfully');
      }

      // Upload attachments if any
      if (filesToUpload.length > 0) {
        await projectService.addTaskAttachments(savedTask.id, filesToUpload);
      }

      onSaved();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!task) return;
    try {
      await projectService.deleteTaskAttachment(task.id, attachmentId);
      toast.success('Attachment deleted');
      // Refresh task data would be handled by parent
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFilesToUpload([...filesToUpload, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFilesToUpload(filesToUpload.filter((_, i) => i !== index));
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
                <MenuItem value="in_review">In Review</MenuItem>
                <MenuItem value="done">Done</MenuItem>
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

          {/* Existing Attachments */}
          {task && task.attachments && task.attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.attachments.map((att) => {
                  const isImage = att.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName);
                  // filePath is stored as /uploads/tasks/filename, API is at localhost:5000
                  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                  const fileUrl = att.filePath?.startsWith('http') ? att.filePath : `${baseUrl}${att.filePath}`;

                  return (
                    <Paper
                      key={att.id}
                      variant="outlined"
                      sx={{
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: isImage ? 120 : 'auto',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      component="a"
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {isImage ? (
                        <Box
                          component="img"
                          src={fileUrl}
                          alt={att.fileName}
                          sx={{
                            width: 100,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 0.5,
                          }}
                        />
                      ) : (
                        <AttachFile sx={{ fontSize: 40, color: 'text.secondary', mb: 0.5 }} />
                      )}
                      <Typography variant="caption" noWrap sx={{ maxWidth: 100, textAlign: 'center' }}>
                        {att.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                      {!viewOnly && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteAttachment(att.id);
                          }}
                          sx={{ mt: 0.5 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* New Files to Upload */}
          {!viewOnly && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Files
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                size="small"
              >
                Select Files
                <input type="file" hidden multiple onChange={handleFileSelect} />
              </Button>
              {filesToUpload.length > 0 && (
                <List dense>
                  {filesToUpload.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AttachFile />
                      </ListItemIcon>
                      <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small" onClick={() => handleRemoveFile(index)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

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
