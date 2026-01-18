import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Avatar,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Warning,
  AttachFile,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { projectService, Task, Project } from '../../services/project.service';
import TaskFormDrawer from './TaskFormDrawer';

interface TasksPanelProps {
  projectId?: number;
  onTaskUpdate?: () => void;
}

const TasksPanel: React.FC<TasksPanelProps> = ({ projectId, onTaskUpdate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState<number | ''>(projectId || '');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);

  // Drawer states
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);

  // Block reason dialog states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [taskToBlock, setTaskToBlock] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadTasks();
    if (!projectId) {
      loadProjects();
    }
  }, [searchTerm, statusFilter, priorityFilter, projectFilter, showMyTasks, showOverdue]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllTasks({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        projectId: projectFilter || projectId || undefined,
        myTasks: showMyTasks || undefined,
        overdue: showOverdue || undefined,
        limit: 100,
      });
      setTasks(response.items);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects({ limit: 100 });
      setProjects(response.items);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setViewOnlyMode(false);
    setTaskDrawerOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setViewOnlyMode(false);
    setTaskDrawerOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewOnlyMode(true);
    setTaskDrawerOpen(true);
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      await projectService.deleteTask(id);
      toast.success('Task deleted successfully');
      loadTasks();
      onTaskUpdate?.();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleTaskSaved = () => {
    setTaskDrawerOpen(false);
    loadTasks();
    onTaskUpdate?.();
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    // If changing to blocked, show dialog for block reason
    if (newStatus === 'blocked' && task.status !== 'blocked') {
      setTaskToBlock(task);
      setBlockReason('');
      setBlockDialogOpen(true);
      return;
    }

    try {
      await projectService.updateTaskStatus(task.id, newStatus);
      toast.success('Task status updated');
      loadTasks();
      onTaskUpdate?.();
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleBlockSubmit = async () => {
    if (!taskToBlock || !blockReason.trim()) return;

    try {
      setIsSubmitting(true);
      await projectService.updateTaskStatus(taskToBlock.id, 'blocked', {
        blockReason: blockReason.trim(),
      });
      toast.success('Task blocked');
      setBlockDialogOpen(false);
      setTaskToBlock(null);
      setBlockReason('');
      loadTasks();
      onTaskUpdate?.();
    } catch (error: any) {
      console.error('Error blocking task:', error);
      toast.error(error.response?.data?.message || 'Failed to block task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="done">Done</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          {!projectId && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={projectFilter}
                label="Project"
                onChange={(e) => setProjectFilter(e.target.value as number | '')}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={showMyTasks}
                onChange={(e) => setShowMyTasks(e.target.checked)}
                size="small"
              />
            }
            label="My Tasks"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showOverdue}
                onChange={(e) => setShowOverdue(e.target.checked)}
                size="small"
                color="error"
              />
            }
            label="Overdue"
          />
          <Box sx={{ flexGrow: 1 }} />
          {canManage && (
            <Button variant="contained" startIcon={<Add />} onClick={handleAddTask}>
              New Task
            </Button>
          )}
        </Box>
      </Paper>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: task.isOverdue ? 'error.light' : undefined,
                    '&:hover': {
                      backgroundColor: task.isOverdue ? 'error.light' : undefined,
                    },
                  }}
                  onClick={() => handleViewTask(task)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle2">{task.title}</Typography>
                        {task.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 200, display: 'block' }}
                          >
                            {task.description}
                          </Typography>
                        )}
                      </Box>
                      {task.attachments && task.attachments.length > 0 && (
                        <Tooltip title={`${task.attachments.length} attachment(s)`}>
                          <AttachFile fontSize="small" color="action" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{task.project?.name || '-'}</TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={task.assignee.profileImageUrl}
                          sx={{ width: 24, height: 24, fontSize: 12 }}
                        >
                          {task.assignee.firstName[0]}
                          {task.assignee.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </Typography>
                          {task.assigneeOnLeave && (
                            <Chip
                              size="small"
                              label="On Leave"
                              color="warning"
                              icon={<Warning />}
                              sx={{ height: 18, fontSize: 10 }}
                            />
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        variant="standard"
                        sx={{
                          '& .MuiSelect-select': {
                            py: 0.5,
                          },
                        }}
                      >
                        <MenuItem value="todo">To Do</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="blocked">Blocked</MenuItem>
                        <MenuItem value="done">Done</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={formatStatus(task.priority)}
                      color={getPriorityColor(task.priority)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {task.dueDate ? (
                        <>
                          <Typography
                            variant="body2"
                            color={task.isOverdue ? 'error' : 'textPrimary'}
                          >
                            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                          {task.isOverdue && (
                            <Typography variant="caption" color="error">
                              Overdue
                            </Typography>
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditTask(task)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManage && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Form Drawer */}
      <TaskFormDrawer
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        task={selectedTask}
        defaultProjectId={projectId || (projectFilter as number) || undefined}
        viewOnly={viewOnlyMode}
        onSaved={handleTaskSaved}
      />

      {/* Block Reason Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => {
          if (!isSubmitting) {
            setBlockDialogOpen(false);
            setTaskToBlock(null);
            setBlockReason('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Block Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for blocking this task:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Block Reason"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Enter the reason for blocking this task..."
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setBlockDialogOpen(false);
              setTaskToBlock(null);
              setBlockReason('');
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleBlockSubmit}
            disabled={isSubmitting || !blockReason.trim()}
          >
            {isSubmitting ? 'Blocking...' : 'Block Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksPanel;
