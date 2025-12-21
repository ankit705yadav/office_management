import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import {
  projectService,
  Task,
  BoardData,
  ReorderTaskItem,
} from '../../services/project.service';
import TaskCard from './TaskCard';
import TaskFormDrawer from './TaskFormDrawer';

interface KanbanBoardProps {
  projectId: number | null;
  canManage: boolean;
  onTaskUpdate?: () => void;
}

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'approved';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do', color: '#9e9e9e', bgColor: 'var(--surface)' },
  { id: 'in_progress', title: 'In Progress', color: '#1976d2', bgColor: 'var(--surface)' },
  { id: 'done', title: 'Done', color: '#2e7d32', bgColor: 'var(--surface)' },
  { id: 'approved', title: 'Approved', color: '#9c27b0', bgColor: 'var(--surface)' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, canManage, onTaskUpdate }) => {
  const [boardData, setBoardData] = useState<BoardData>({
    todo: [],
    in_progress: [],
    done: [],
    approved: [],
  });
  const [loading, setLoading] = useState(true);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [addToColumn, setAddToColumn] = useState<TaskStatus | null>(null);

  useEffect(() => {
    loadBoard();
  }, [projectId]);

  const loadBoard = async () => {
    if (!projectId) {
      setBoardData({ todo: [], in_progress: [], done: [], approved: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await projectService.getTasksForBoard(projectId);
      setBoardData(data);
    } catch (error) {
      console.error('Error loading board:', error);
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId as TaskStatus;
    const destColumn = destination.droppableId as TaskStatus;
    const taskId = parseInt(draggableId.replace('task-', ''));

    // Create new board data
    const newBoardData = { ...boardData };
    const sourceTasks = [...newBoardData[sourceColumn]];
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceColumn === destColumn) {
      // Reordering within same column
      sourceTasks.splice(destination.index, 0, movedTask);
      newBoardData[sourceColumn] = sourceTasks;
    } else {
      // Moving to different column
      const destTasks = [...newBoardData[destColumn]];
      movedTask.status = destColumn;
      destTasks.splice(destination.index, 0, movedTask);
      newBoardData[sourceColumn] = sourceTasks;
      newBoardData[destColumn] = destTasks;
    }

    // Optimistically update UI
    setBoardData(newBoardData);

    // Build reorder payload
    const tasksToUpdate: ReorderTaskItem[] = [];

    // Update source column tasks
    sourceTasks.forEach((task, index) => {
      tasksToUpdate.push({
        id: task.id,
        status: sourceColumn,
        sortOrder: index,
      });
    });

    // Update destination column tasks (if different)
    if (sourceColumn !== destColumn) {
      newBoardData[destColumn].forEach((task, index) => {
        tasksToUpdate.push({
          id: task.id,
          status: destColumn,
          sortOrder: index,
        });
      });
    }

    try {
      await projectService.reorderTasks(tasksToUpdate);
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast.error('Failed to update task order');
      // Reload board on error
      loadBoard();
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setViewOnlyMode(false);
    setAddToColumn(null);
    setTaskDrawerOpen(true);
  };

  const handleAddTask = (column: TaskStatus) => {
    setSelectedTask(null);
    setViewOnlyMode(false);
    setAddToColumn(column);
    setTaskDrawerOpen(true);
  };

  const handleTaskSaved = () => {
    setTaskDrawerOpen(false);
    loadBoard();
    onTaskUpdate?.();
  };

  if (!projectId) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <Typography>Select a project to view the Kanban board</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Board Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Task Board</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadBoard} size="small">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexGrow: 1,
            overflow: 'auto',
            pb: 2,
          }}
        >
          {columns.map((column) => (
            <Box
              key={column.id}
              sx={{
                minWidth: 280,
                maxWidth: 320,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <Paper
                sx={{
                  p: 1.5,
                  mb: 1,
                  backgroundColor: column.bgColor,
                  borderLeft: 4,
                  borderLeftColor: column.color,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {column.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={boardData[column.id].length}
                      sx={{
                        height: 20,
                        minWidth: 24,
                        backgroundColor: column.color,
                        color: 'white',
                      }}
                    />
                  </Box>
                  {canManage && (
                    <Tooltip title="Add task">
                      <IconButton size="small" onClick={() => handleAddTask(column.id)}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      flexGrow: 1,
                      minHeight: 100,
                      p: 1,
                      backgroundColor: snapshot.isDraggingOver ? 'var(--sidebar-item-hover)' : 'var(--bg-elevated)',
                      borderRadius: 1,
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {boardData[column.id].map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={handleTaskClick}
                      />
                    ))}
                    {provided.placeholder}

                    {/* Empty State */}
                    {boardData[column.id].length === 0 && (
                      <Box
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          color: 'text.secondary',
                          border: '2px dashed',
                          borderColor: 'divider',
                          borderRadius: 1,
                          opacity: snapshot.isDraggingOver ? 0 : 1,
                        }}
                      >
                        <Typography variant="body2">Drop tasks here</Typography>
                        {canManage && (
                          <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleAddTask(column.id)}
                            sx={{ mt: 1 }}
                          >
                            Add Task
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Droppable>
            </Box>
          ))}
        </Box>
      </DragDropContext>

      {/* Task Form Drawer */}
      <TaskFormDrawer
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        task={selectedTask}
        defaultProjectId={projectId}
        viewOnly={viewOnlyMode}
        onSaved={handleTaskSaved}
      />
    </Box>
  );
};

export default KanbanBoard;
