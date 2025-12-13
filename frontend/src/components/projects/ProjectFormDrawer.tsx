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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Close, Save, Folder, Description } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectService, Project, CreateProjectRequest, UpdateProjectRequest } from '../../services/project.service';
import api from '../../services/api';

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectFormDrawerProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  viewOnly?: boolean;
  onSaved: () => void;
  parentId?: number;
}

const ProjectFormDrawer: React.FC<ProjectFormDrawerProps> = ({
  open,
  onClose,
  project,
  viewOnly = false,
  onSaved,
  parentId,
}) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: null as number | null,
    ownerId: null as number | null,
    status: 'active',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: '',
    parentId: null as number | null,
    projectCode: '',
    isFolder: false,
  });

  useEffect(() => {
    if (open) {
      loadDepartments();
      loadUsers();
      loadProjects();
      if (project) {
        setFormData({
          name: project.name || '',
          description: project.description || '',
          departmentId: project.departmentId || null,
          ownerId: project.ownerId || null,
          status: project.status || 'active',
          priority: project.priority || 'medium',
          startDate: project.startDate ? project.startDate.split('T')[0] : '',
          endDate: project.endDate ? project.endDate.split('T')[0] : '',
          budget: project.budget?.toString() || '',
          parentId: project.parentId || null,
          projectCode: project.projectCode || '',
          isFolder: project.isFolder || false,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          departmentId: null,
          ownerId: null,
          status: 'active',
          priority: 'medium',
          startDate: '',
          endDate: '',
          budget: '',
          parentId: parentId || null,
          projectCode: '',
          isFolder: false,
        });
      }
    }
  }, [open, project, parentId]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAllProjects({ limit: 100 });
      setAllProjects(response.items);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      // API returns { data: { departments: [...] } }
      setDepartments(response.data?.data?.departments || response.data?.departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users', { params: { limit: 100, status: 'active' } });
      // API returns { status: 'success', data: { users: [...] } }
      setUsers(response.data?.data?.users || response.data?.users || response.data?.items || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;

    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setLoading(true);
      const data: CreateProjectRequest | UpdateProjectRequest = {
        name: formData.name,
        description: formData.description || undefined,
        departmentId: formData.departmentId || undefined,
        ownerId: formData.ownerId || undefined,
        priority: formData.priority as any,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        parentId: formData.parentId || undefined,
        projectCode: formData.projectCode || undefined,
        isFolder: formData.isFolder,
      };

      if (project) {
        (data as UpdateProjectRequest).status = formData.status as any;
        await projectService.updateProject(project.id, data as UpdateProjectRequest);
        toast.success('Project updated successfully');
      } else {
        await projectService.createProject(data as CreateProjectRequest);
        toast.success('Project created successfully');
      }
      onSaved();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const selectedOwner = users.find((u) => u.id === formData.ownerId) || null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 450, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {viewOnly ? 'View Project' : project ? 'Edit Project' : 'New Project'}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          {/* Parent Project */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Parent Project</InputLabel>
            <Select
              value={formData.parentId || ''}
              label="Parent Project"
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value as number || null })}
              disabled={viewOnly}
            >
              <MenuItem value="">None (Root Project)</MenuItem>
              {allProjects
                .filter((p) => p.id !== project?.id) // Prevent self-referencing
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.isFolder ? <Folder fontSize="small" sx={{ mr: 1 }} /> : <Description fontSize="small" sx={{ mr: 1 }} />}
                    {p.name} {p.projectCode && `(${p.projectCode})`}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Project Code & Is Folder */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Project Code"
              value={formData.projectCode}
              onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
              disabled={viewOnly}
              placeholder="Auto-generated if empty"
              helperText={!project ? 'Leave empty for auto-generation' : undefined}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFolder}
                  onChange={(e) => setFormData({ ...formData, isFolder: e.target.checked })}
                  disabled={viewOnly}
                />
              }
              label="Folder"
              sx={{ minWidth: 100 }}
            />
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={formData.departmentId || ''}
              label="Department"
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value as number || null })}
              disabled={viewOnly}
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            value={selectedOwner}
            onChange={(_, newValue) => setFormData({ ...formData, ownerId: newValue?.id || null })}
            disabled={viewOnly}
            renderInput={(params) => <TextField {...params} label="Owner" />}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={viewOnly || !project}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={viewOnly}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={viewOnly}
            />
          </Box>

          <TextField
            fullWidth
            label="Budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            disabled={viewOnly}
            sx={{ mb: 3 }}
          />

          {project && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Task Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2">
                  Total: {project.taskCounts?.total || 0}
                </Typography>
                <Typography variant="body2" color="info.main">
                  To Do: {project.taskCounts?.todo || 0}
                </Typography>
                <Typography variant="body2" color="warning.main">
                  In Progress: {project.taskCounts?.inProgress || 0}
                </Typography>
                <Typography variant="body2" color="secondary.main">
                  In Review: {project.taskCounts?.inReview || 0}
                </Typography>
                <Typography variant="body2" color="success.main">
                  Done: {project.taskCounts?.done || 0}
                </Typography>
              </Box>
            </Box>
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
                {project ? 'Update' : 'Create'}
              </Button>
            </Box>
          )}
        </form>
      </Box>
    </Drawer>
  );
};

export default ProjectFormDrawer;
