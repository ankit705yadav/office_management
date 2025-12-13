import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
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
  ExpandLess,
  ExpandMore,
  Folder,
  FolderOpen,
  Description,
  Add,
  MoreVert,
  Edit,
  Delete,
  CreateNewFolder,
  Search,
  Refresh,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectService, Project } from '../../services/project.service';

interface ProjectSidebarProps {
  selectedProjectId: number | null;
  onSelectProject: (project: Project | null) => void;
  onCreateProject: (parentId?: number) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  canManage: boolean;
}

interface ProjectTreeItemProps {
  project: Project;
  level: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (project: Project) => void;
  onToggleExpand: (id: number) => void;
  onContextMenu: (event: React.MouseEvent, project: Project) => void;
}

const ProjectTreeItem: React.FC<ProjectTreeItemProps> = ({
  project,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onContextMenu,
}) => {
  const hasChildren = project.children && project.children.length > 0;
  const isExpanded = expandedIds.has(project.id);
  const isSelected = selectedId === project.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project.isFolder) {
      onSelect(project);
    } else if (hasChildren) {
      onToggleExpand(project.id);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(project.id);
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

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, project)}
        sx={{
          pl: 2 + level * 2,
          py: 0.75,
          borderRadius: 1,
          mb: 0.25,
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '& .MuiListItemIcon-root': {
              color: 'primary.contrastText',
            },
            '& .MuiChip-root': {
              borderColor: 'rgba(255,255,255,0.7)',
              color: 'primary.contrastText',
            },
            '& .MuiTypography-root': {
              color: 'primary.contrastText !important',
            },
            '& .MuiListItemText-secondary': {
              color: 'rgba(255,255,255,0.8) !important',
            },
          },
        }}
      >
        {/* Expand/Collapse button for folders or projects with children */}
        {(project.isFolder || hasChildren) ? (
          <IconButton
            size="small"
            onClick={handleExpandClick}
            sx={{ mr: 0.5, p: 0.25 }}
          >
            {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}

        <ListItemIcon sx={{ minWidth: 32 }}>
          {project.isFolder ? (
            isExpanded ? <FolderOpen fontSize="small" /> : <Folder fontSize="small" />
          ) : (
            <Description fontSize="small" />
          )}
        </ListItemIcon>

        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" noWrap sx={{ flexShrink: 1, minWidth: 0, color: 'text.primary' }}>
                {project.name}
              </Typography>
              {project.projectCode && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  ({project.projectCode})
                </Typography>
              )}
            </Box>
          }
          secondary={
            !project.isFolder && project.taskCounts ? (
              `${project.taskCounts.done}/${project.taskCounts.total} tasks`
            ) : null
          }
        />

        {!project.isFolder && (
          <Chip
            size="small"
            label={project.status.replace('_', ' ')}
            color={getStatusColor(project.status) as any}
            variant="outlined"
            sx={{ height: 18, fontSize: 10, ml: 'auto' }}
          />
        )}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {project.children!.map((child) => (
              <ProjectTreeItem
                key={child.id}
                project={child}
                level={level + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onContextMenu={onContextMenu}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  canManage,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
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
      const data = await projectService.getProjectHierarchy();
      setProjects(data);
      // Auto-expand root level folders
      const rootFolderIds = data
        .filter((p) => p.isFolder || (p.children && p.children.length > 0))
        .map((p) => p.id);
      setExpandedIds(new Set(rootFolderIds));
    } catch (error) {
      console.error('Error loading project hierarchy:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

  const handleCreateSubProject = () => {
    if (contextMenu?.project) {
      onCreateProject(contextMenu.project.id);
    }
    handleCloseContextMenu();
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

  const filterProjects = (projectList: Project[], term: string): Project[] => {
    if (!term) return projectList;

    const lowerTerm = term.toLowerCase();
    return projectList.reduce<Project[]>((acc, project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(lowerTerm) ||
        project.projectCode?.toLowerCase().includes(lowerTerm);

      const filteredChildren = project.children
        ? filterProjects(project.children, term)
        : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...project,
          children: filteredChildren.length > 0 ? filteredChildren : project.children,
        });
      }

      return acc;
    }, []);
  };

  const filteredProjects = filterProjects(projects, searchTerm);

  return (
    <Box
      sx={{
        width: 300,
        minWidth: 280,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Projects
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadProjects}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && (
              <Tooltip title="New Project">
                <IconButton size="small" onClick={() => onCreateProject()}>
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

      {/* Project Tree */}
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
                <IconButton onClick={() => onCreateProject()} sx={{ mt: 1 }}>
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
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '& .MuiTypography-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Tasks" />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <List disablePadding>
              {filteredProjects.map((project) => (
                <ProjectTreeItem
                  key={project.id}
                  project={project}
                  level={0}
                  selectedId={selectedProjectId}
                  expandedIds={expandedIds}
                  onSelect={onSelectProject}
                  onToggleExpand={handleToggleExpand}
                  onContextMenu={handleContextMenu}
                />
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
        <MenuItem onClick={handleCreateSubProject}>
          <ListItemIcon>
            <CreateNewFolder fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Sub-project</ListItemText>
        </MenuItem>
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
