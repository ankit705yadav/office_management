import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Warning,
  ViewKanban,
  TableChart,
  FolderOpen,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { projectService, Project, ProjectStats, TasksAtRisk } from '../services/project.service';
import ProjectFormDrawer from '../components/projects/ProjectFormDrawer';
import TasksPanel from '../components/projects/TasksPanel';
import ProjectSidebar from '../components/projects/ProjectSidebar';
import KanbanBoard from '../components/projects/KanbanBoard';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [tasksAtRisk, setTasksAtRisk] = useState<TasksAtRisk | null>(null);

  // Drawer states
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<number | undefined>(undefined);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadStats();
    loadTasksAtRisk();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await projectService.getProjectStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTasksAtRisk = async () => {
    try {
      const data = await projectService.getTasksAtRisk();
      setTasksAtRisk(data);
    } catch (error) {
      console.error('Error loading tasks at risk:', error);
    }
  };

  const handleSelectProject = (project: Project | null) => {
    setSelectedProject(project);
  };

  const handleCreateProject = (parentId?: number) => {
    setEditingProject(null);
    setViewOnlyMode(false);
    setParentIdForNew(parentId);
    setProjectDrawerOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setViewOnlyMode(false);
    setParentIdForNew(undefined);
    setProjectDrawerOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This will also delete all sub-projects and tasks.`)) {
      return;
    }
    try {
      await projectService.deleteProject(project.id);
      toast.success('Project deleted successfully');
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }
      loadStats();
      // Sidebar will refresh via its own useEffect or we can trigger a refresh
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleProjectSaved = () => {
    setProjectDrawerOpen(false);
    loadStats();
  };

  const handleTaskUpdate = useCallback(() => {
    loadStats();
  }, []);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Project Sidebar */}
      <ProjectSidebar
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        canManage={canManage}
      />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" component="h1">
                {selectedProject ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOpen color="primary" />
                    {selectedProject.name}
                    {selectedProject.projectCode && (
                      <Chip
                        label={selectedProject.projectCode}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    )}
                  </Box>
                ) : (
                  'All Tasks'
                )}
              </Typography>
              {selectedProject?.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedProject.description}
                </Typography>
              )}
            </Box>
            {canManage && selectedProject && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleCreateProject(selectedProject.id)}
                size="small"
              >
                Add Sub-project
              </Button>
            )}
          </Box>

          {/* Stats Row */}
          {stats && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Projects:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {stats.projectsByStatus?.active || 0}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  My Tasks:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {stats.myTasks || 0}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="error.main">
                  Overdue:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                  {stats.overdueTasks || 0}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="warning.main">
                  Due This Week:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                  {stats.tasksDueThisWeek || 0}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Tasks at Risk Warning */}
          {tasksAtRisk && tasksAtRisk.tasksAtRisk.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
              <Typography variant="subtitle2">
                {tasksAtRisk.tasksAtRisk.length} task(s) at risk due to team members on leave
              </Typography>
              <Typography variant="body2">
                {tasksAtRisk.usersOnLeave.map((u) => `${u.firstName} ${u.lastName}`).join(', ')} will be on leave soon
              </Typography>
            </Alert>
          )}

          {/* View Mode Tabs */}
          {selectedProject && !selectedProject.isFolder && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)}>
                <Tab
                  value="board"
                  icon={<ViewKanban fontSize="small" />}
                  label="Board"
                  iconPosition="start"
                  sx={{ minHeight: 40 }}
                />
                <Tab
                  value="table"
                  icon={<TableChart fontSize="small" />}
                  label="Table"
                  iconPosition="start"
                  sx={{ minHeight: 40 }}
                />
              </Tabs>
            </Box>
          )}
        </Box>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {selectedProject ? (
            selectedProject.isFolder ? (
              // Folder selected - show message to select a project
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                }}
              >
                <FolderOpen sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">This is a folder</Typography>
                <Typography variant="body2">
                  Select a project from the sidebar to view its tasks
                </Typography>
                {canManage && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleCreateProject(selectedProject.id)}
                    sx={{ mt: 2 }}
                  >
                    Create Project in this Folder
                  </Button>
                )}
              </Box>
            ) : viewMode === 'board' ? (
              <KanbanBoard
                projectId={selectedProject.id}
                canManage={canManage}
                onTaskUpdate={handleTaskUpdate}
              />
            ) : (
              <TasksPanel
                projectId={selectedProject.id}
                onTaskUpdate={handleTaskUpdate}
              />
            )
          ) : (
            // All Tasks view
            <TasksPanel onTaskUpdate={handleTaskUpdate} />
          )}
        </Box>
      </Box>

      {/* Project Form Drawer */}
      <ProjectFormDrawer
        open={projectDrawerOpen}
        onClose={() => setProjectDrawerOpen(false)}
        project={editingProject}
        viewOnly={viewOnlyMode}
        onSaved={handleProjectSaved}
        parentId={parentIdForNew}
      />
    </Box>
  );
};

export default ProjectsPage;
