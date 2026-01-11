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
import { Close, Save, Warning, Link as LinkIcon, ExpandMore, ContentCopy, Delete, Add } from '@mui/icons-material';
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
  TaskAttachment,
  TaskAttachmentLink,
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
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [pendingLinks, setPendingLinks] = useState<TaskAttachmentLink[]>([]); // For new tasks
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);

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
          // Initialize attachments
          setAttachments(taskData.attachments || []);
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
        setAttachments([]);
        setPendingLinks([]);
        setBlockingDependencies([]);
        setAvailableTasks([]);
      }
    } else {
      setFullTask(null);
      setAttachments([]);
      setPendingLinks([]);
    }
  }, [open, task?.id, defaultProjectId]);

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

        // Add pending attachment links after task creation
        if (pendingLinks.length > 0) {
          try {
            await projectService.addTaskAttachments(savedTask.id, pendingLinks);
          } catch (error) {
            console.error('Error adding attachments:', error);
            // Don't fail the whole operation, task was created
          }
        }

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

  // Attachment handlers
  const handleAddAttachment = async () => {
    if (!newLinkUrl.trim()) return;

    const newLink: TaskAttachmentLink = {
      linkUrl: newLinkUrl.trim(),
      linkTitle: newLinkTitle.trim() || newLinkUrl.trim(),
    };

    if (currentTask) {
      // Existing task - save to API immediately
      try {
        setAddingLink(true);
        const newAttachments = await projectService.addTaskAttachments(currentTask.id, [newLink]);
        setAttachments(prev => [...prev, ...newAttachments]);
        setNewLinkUrl('');
        setNewLinkTitle('');
        toast.success('Link added');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to add link');
      } finally {
        setAddingLink(false);
      }
    } else {
      // New task - store locally, will be saved after task creation
      setPendingLinks(prev => [...prev, newLink]);
      setNewLinkUrl('');
      setNewLinkTitle('');
    }
  };

  const handleRemovePendingLink = (index: number) => {
    setPendingLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!currentTask) return;

    try {
      await projectService.deleteTaskAttachment(currentTask.id, attachmentId);
      setAttachments(prev => prev.filter((a) => a.id !== attachmentId));
      toast.success('Link removed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove link');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
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

          {/* Attachment Links */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon fontSize="small" />
              Attachment Links
            </Typography>

            {/* Existing attachments (for saved tasks) */}
            {attachments.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                {attachments.map((attachment) => (
                  <Paper
                    key={attachment.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <LinkIcon fontSize="small" color="primary" />
                    <Box
                      sx={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => window.open(attachment.linkUrl, '_blank')}
                    >
                      <Typography
                        variant="body2"
                        noWrap
                        title={attachment.linkTitle}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': { color: 'primary.dark' },
                        }}
                      >
                        {attachment.linkTitle || attachment.linkUrl}
                      </Typography>
                      {attachment.linkTitle && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          title={attachment.linkUrl}
                          sx={{ display: 'block' }}
                        >
                          {attachment.linkUrl}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyLink(attachment.linkUrl)}
                      title="Copy link"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => window.open(attachment.linkUrl, '_blank')}
                      title="Open link"
                      color="primary"
                    >
                      <LinkIcon fontSize="small" />
                    </IconButton>
                    {!viewOnly && canEditTask && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        title="Remove link"
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Paper>
                ))}
              </Box>
            ) : (
              viewOnly && pendingLinks.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  No attachment links
                </Typography>
              )
            )}

            {/* Pending links (for new tasks - not yet saved) */}
            {pendingLinks.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {pendingLinks.map((link, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderStyle: 'dashed',
                    }}
                  >
                    <LinkIcon fontSize="small" color="action" />
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap title={link.linkTitle}>
                        {link.linkTitle}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        title={link.linkUrl}
                        sx={{ display: 'block' }}
                      >
                        {link.linkUrl}
                      </Typography>
                    </Box>
                    <Chip label="Pending" size="small" variant="outlined" />
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePendingLink(index)}
                      title="Remove link"
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Add new link form */}
            {!viewOnly && canEditTask && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Link title (optional)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttachment())}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddAttachment}
                    disabled={addingLink || !newLinkUrl.trim()}
                    startIcon={addingLink ? <CircularProgress size={16} /> : <Add />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

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
