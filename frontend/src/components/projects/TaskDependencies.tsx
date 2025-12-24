import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add,
  Delete,
  Link as LinkIcon,
  Block,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectService, Task, TaskDependencyInfo } from '../../services/project.service';

interface TaskDependenciesProps {
  taskId: number;
  projectId: number;
  canEdit: boolean;
  onDependencyChange?: () => void;
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  taskId,
  projectId,
  canEdit,
  onDependencyChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dependencyInfo, setDependencyInfo] = useState<TaskDependencyInfo | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadDependencies();
    loadAvailableTasks();
  }, [taskId, projectId]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const info = await projectService.getTaskDependencies(taskId);
      setDependencyInfo(info);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const response = await projectService.getAllTasks({ projectId, limit: 100 });
      // Filter out current task and tasks that already depend on this task (to prevent circular)
      setAvailableTasks(response.items.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleAddDependencies = async () => {
    if (selectedTasks.length === 0) return;

    try {
      setSaving(true);
      await projectService.addTaskDependencies(
        taskId,
        selectedTasks.map((t) => t.id)
      );
      toast.success('Dependencies added successfully');
      setSelectedTasks([]);
      setShowAddForm(false);
      await loadDependencies();
      onDependencyChange?.();
    } catch (error: any) {
      console.error('Error adding dependencies:', error);
      toast.error(error.response?.data?.message || 'Failed to add dependencies');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: number) => {
    try {
      await projectService.removeTaskDependency(taskId, dependencyId);
      toast.success('Dependency removed');
      await loadDependencies();
      onDependencyChange?.();
    } catch (error: any) {
      console.error('Error removing dependency:', error);
      toast.error(error.response?.data?.message || 'Failed to remove dependency');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
      case 'approved':
        return <CheckCircle fontSize="small" color="success" />;
      case 'blocked':
        return <Block fontSize="small" color="error" />;
      case 'in_progress':
        return <Schedule fontSize="small" color="primary" />;
      default:
        return <Schedule fontSize="small" color="disabled" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'blocked':
        return 'Blocked';
      case 'done':
        return 'Done';
      case 'approved':
        return 'Approved';
      default:
        return status;
    }
  };

  // Filter out tasks that are already dependencies
  const existingDependencyIds = dependencyInfo?.dependencies.map((d) => d.id) || [];
  const filteredAvailableTasks = availableTasks.filter(
    (t) => !existingDependencyIds.includes(t.id)
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon fontSize="small" />
          Dependencies
          {dependencyInfo?.dependencies.length ? (
            <Chip size="small" label={dependencyInfo.dependencies.length} />
          ) : null}
        </Typography>
        {canEdit && !showAddForm && (
          <IconButton size="small" onClick={() => setShowAddForm(true)}>
            <Add fontSize="small" />
          </IconButton>
        )}
      </Box>

      {dependencyInfo?.isBlocked && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Block />}>
          This task is blocked by {dependencyInfo.blockingTasks.length} incomplete{' '}
          {dependencyInfo.blockingTasks.length === 1 ? 'task' : 'tasks'}
        </Alert>
      )}

      {showAddForm && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Autocomplete
            multiple
            options={filteredAvailableTasks}
            getOptionLabel={(option) =>
              `${option.taskCode || `#${option.id}`}: ${option.title}`
            }
            value={selectedTasks}
            onChange={(_, newValue) => setSelectedTasks(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Select tasks this depends on"
                placeholder="Search tasks..."
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(option.status)}
                  <Box>
                    <Typography variant="body2">
                      {option.taskCode || `#${option.id}`}: {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getStatusLabel(option.status)}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton
              size="small"
              onClick={() => {
                setShowAddForm(false);
                setSelectedTasks([]);
              }}
            >
              Cancel
            </IconButton>
            <IconButton
              size="small"
              color="primary"
              onClick={handleAddDependencies}
              disabled={saving || selectedTasks.length === 0}
            >
              {saving ? <CircularProgress size={20} /> : <Add />}
            </IconButton>
          </Box>
        </Paper>
      )}

      {dependencyInfo?.dependencies.length === 0 && !showAddForm ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No dependencies
        </Typography>
      ) : (
        <List dense disablePadding>
          {dependencyInfo?.dependencies.map((dep) => {
            const isBlocking = ['todo', 'in_progress', 'blocked'].includes(dep.status);
            return (
              <ListItem
                key={dep.id}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  backgroundColor: isBlocking ? 'error.lighter' : 'success.lighter',
                  border: '1px solid',
                  borderColor: isBlocking ? 'error.light' : 'success.light',
                }}
              >
                <Box sx={{ mr: 1 }}>{getStatusIcon(dep.status)}</Box>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium">
                      {dep.taskCode || `#${dep.id}`}: {dep.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {getStatusLabel(dep.status)}
                      {dep.assignee && ` • ${dep.assignee.firstName} ${dep.assignee.lastName}`}
                    </Typography>
                  }
                />
                {canEdit && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Remove dependency">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => handleRemoveDependency(dep.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default TaskDependencies;
