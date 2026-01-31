import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Description,
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  ChevronLeft,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectService, Project } from '../../services/project.service';

interface ProjectSidebarProps {
  selectedProjectId: number | null;
  selectedProject?: Project | null;
  onSelectProject: (project: Project | null) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  canManage: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const SIDEBAR_EXPANDED_WIDTH = 300;
const SIDEBAR_COLLAPSED_WIDTH = 56;

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  selectedProjectId,
  selectedProject,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  canManage,
  collapsed = false,
  onCollapsedChange,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    project: Project;
  } | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects({ limit: 100 });
      setProjects(data.items);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, project: Project) => {
    event.preventDefault();
    if (canManage) {
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
        project,
      });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleEditFromContext = () => {
    if (contextMenu?.project) {
      onEditProject(contextMenu.project);
    }
    handleCloseContextMenu();
  };

  const handleDeleteFromContext = () => {
    if (contextMenu?.project) {
      onDeleteProject(contextMenu.project);
    }
    handleCloseContextMenu();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return project.name.toLowerCase().includes(lowerTerm);
  });

  // Collapsed view: narrow bar with expand button
  if (collapsed) {
    return (
      <Box
        sx={{
          width: SIDEBAR_COLLAPSED_WIDTH,
          minWidth: SIDEBAR_COLLAPSED_WIDTH,
          height: '100%',
          borderRight: 1,
          borderColor: 'var(--border)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'var(--surface)',
          alignItems: 'center',
          pt: 2,
          transition: 'width 0.2s ease',
        }}
      >
        <Tooltip title="Show projects">
          <IconButton
            onClick={() => onCollapsedChange?.(false)}
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': { color: 'var(--accent-primary)' },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        {selectedProject && (
          <Tooltip title={selectedProject.name} placement="right">
            <Box
              sx={{
                mt: 2,
                width: 36,
                height: 36,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'var(--bg-elevated)',
                border: 1,
                borderColor: 'var(--border)',
              }}
            >
              <Description fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: SIDEBAR_EXPANDED_WIDTH,
        minWidth: 280,
        height: '100%',
        borderRight: 1,
        borderColor: 'var(--border)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--surface)',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'var(--border)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
            Projects
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onCollapsedChange && selectedProject && (
              <Tooltip title="Collapse sidebar">
                <IconButton size="small" onClick={() => onCollapsedChange(true)}>
                  <ChevronLeft fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadProjects}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && (
              <Tooltip title="New Project">
                <IconButton size="small" onClick={onCreateProject}>
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Project List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </Typography>
            {canManage && !searchTerm && (
              <Tooltip title="Create your first project">
                <IconButton onClick={onCreateProject} sx={{ mt: 1 }}>
                  <Add />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          <>
            {/* All Tasks option */}
            <ListItemButton
              selected={selectedProjectId === null}
              onClick={() => onSelectProject(null)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#ffffff !important',
                  },
                  '& .MuiTypography-root': {
                    color: '#ffffff !important',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'var(--text-secondary)' }}>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                    All Tasks
                  </Typography>
                }
              />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <List disablePadding>
              {filteredProjects.map((project) => (
                <ListItemButton
                  key={project.id}
                  selected={selectedProjectId === project.id}
                  onClick={() => onSelectProject(project)}
                  onContextMenu={(e) => handleContextMenu(e, project)}
                  sx={{
                    pl: 2,
                    py: 0.75,
                    borderRadius: 1,
                    mb: 0.25,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#ffffff !important',
                      },
                      '& .MuiChip-root': {
                        borderColor: 'rgba(255,255,255,0.7)',
                        color: '#ffffff',
                      },
                      '& .MuiTypography-root': {
                        color: '#ffffff !important',
                      },
                      '& .MuiListItemText-secondary': {
                        color: 'rgba(255,255,255,0.8) !important',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'var(--text-secondary)' }}>
                    <Description fontSize="small" />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap sx={{ color: 'var(--text-primary)' }}>
                        {project.name}
                      </Typography>
                    }
                    secondary={
                      project.taskCounts ? (
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                          {project.taskCounts.done}/{project.taskCounts.total} tasks
                        </Typography>
                      ) : null
                    }
                  />

                  <Chip
                    size="small"
                    label={project.status.replace('_', ' ')}
                    color={getStatusColor(project.status) as any}
                    variant="outlined"
                    sx={{ height: 18, fontSize: 10, ml: 'auto' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleEditFromContext}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteFromContext}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectSidebar;
