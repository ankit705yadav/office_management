import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Flag,
  AttachFile,
  Warning,
  Schedule,
  PriorityHigh,
  Block,
  Link as LinkIcon,
  Comment,
} from '@mui/icons-material';
import { format, isPast, isToday } from 'date-fns';
import { Task } from '../../services/project.service';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#1976d2';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  const isBlocked = task.status === 'blocked' || task.isBlocked;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const dependencyCount = task.dependencies?.length || 0;
  const blockingCount = task.blockingTasks?.length || 0;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          sx={{
            mb: 1,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, transform 0.2s',
            borderLeft: 4,
            borderLeftColor: isBlocked ? '#d32f2f' : getPriorityColor(task.priority),
            backgroundColor: snapshot.isDragging ? 'action.selected' : isBlocked ? 'error.lighter' : 'background.paper',
            transform: snapshot.isDragging ? 'rotate(3deg)' : 'none',
            boxShadow: snapshot.isDragging ? 4 : 1,
            '&:hover': {
              boxShadow: 3,
            },
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            {/* Task Code & Action Required */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {task.taskCode && (
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {task.taskCode}
                  </Typography>
                )}
                {isBlocked && (
                  <Chip
                    icon={<Block sx={{ fontSize: 12 }} />}
                    label="Blocked"
                    size="small"
                    color="error"
                    sx={{ height: 18, fontSize: 10, '& .MuiChip-icon': { fontSize: 12, ml: 0.5 } }}
                  />
                )}
              </Box>
              {task.actionRequired && (
                <Tooltip title="Action Required">
                  <PriorityHigh fontSize="small" color="error" />
                </Tooltip>
              )}
            </Box>

            {/* Title */}
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {task.title}
            </Typography>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                {task.tags.slice(0, 2).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                ))}
                {task.tags.length > 2 && (
                  <Chip
                    label={`+${task.tags.length - 2}`}
                    size="small"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                )}
              </Box>
            )}

            {/* Footer: Assignee, Due Date, Attachments */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              {/* Left side: Assignee */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {task.assignee ? (
                  <Tooltip title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar
                        src={task.assignee.profileImageUrl}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 10,
                          border: task.assigneeOnLeave ? '2px solid' : 'none',
                          borderColor: task.assigneeOnLeave ? 'warning.main' : undefined,
                        }}
                      >
                        {task.assignee.firstName[0]}
                        {task.assignee.lastName[0]}
                      </Avatar>
                      {task.assigneeOnLeave && (
                        <Tooltip title="On Leave">
                          <Warning fontSize="small" color="warning" sx={{ ml: -0.5 }} />
                        </Tooltip>
                      )}
                    </Box>
                  </Tooltip>
                ) : (
                  <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'grey.300' }}>
                    ?
                  </Avatar>
                )}
              </Box>

              {/* Right side: Due date, attachments, dependencies, comments */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {dependencyCount > 0 && (
                  <Tooltip title={`${dependencyCount} ${dependencyCount === 1 ? 'dependency' : 'dependencies'}${blockingCount > 0 ? ` (${blockingCount} blocking)` : ''}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinkIcon fontSize="small" sx={{ fontSize: 14, color: blockingCount > 0 ? 'error.main' : 'text.secondary' }} />
                      <Typography variant="caption" color={blockingCount > 0 ? 'error.main' : 'text.secondary'}>
                        {dependencyCount}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {task.commentCount !== undefined && task.commentCount > 0 && (
                  <Tooltip title={`${task.commentCount} ${task.commentCount === 1 ? 'comment' : 'comments'}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Comment fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {task.commentCount}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {task.attachments && task.attachments.length > 0 && (
                  <Tooltip title={`${task.attachments.length} attachment(s)`}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachFile fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {task.attachments.length}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {task.dueDate && (
                  <Tooltip title={isOverdue ? 'Overdue' : isDueToday ? 'Due today' : 'Due date'}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        color: isOverdue ? 'error.main' : isDueToday ? 'warning.main' : 'text.secondary',
                      }}
                    >
                      <Schedule sx={{ fontSize: 14 }} />
                      <Typography variant="caption" fontWeight={isOverdue || isDueToday ? 'bold' : 'normal'}>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Estimated/Actual Hours */}
            {(task.estimatedHours || task.actualHours > 0) && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                {task.estimatedHours && (
                  <Typography variant="caption" color="text.secondary">
                    Est: {task.estimatedHours}h
                  </Typography>
                )}
                {task.actualHours > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Act: {task.actualHours}h
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCard;
