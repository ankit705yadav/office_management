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

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
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
            borderLeftColor: getPriorityColor(task.priority),
            backgroundColor: snapshot.isDragging ? 'action.selected' : 'background.paper',
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
              {task.taskCode && (
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                  {task.taskCode}
                </Typography>
              )}
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

              {/* Right side: Due date & attachments */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
