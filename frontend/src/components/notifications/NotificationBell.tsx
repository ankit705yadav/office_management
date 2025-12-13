import React, { useState, useRef } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  EventAvailable,
  Assignment,
  AccessTime,
  Description,
  CheckCircle,
  Circle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/services/notification.service';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'leave':
      return <EventAvailable sx={{ color: 'var(--accent-success)' }} />;
    case 'task':
      return <Assignment sx={{ color: 'var(--accent-primary)' }} />;
    case 'attendance':
      return <AccessTime sx={{ color: 'var(--accent-warning)' }} />;
    case 'daily_report':
      return <Description sx={{ color: 'var(--accent-info)' }} />;
    default:
      return <Notifications sx={{ color: 'var(--text-secondary)' }} />;
  }
};

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    handleClose();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        ref={buttonRef}
        onClick={handleOpen}
        sx={{
          color: 'var(--text-secondary)',
          '&:hover': { backgroundColor: 'var(--sidebar-item-hover)' },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: 18,
              minWidth: 18,
            },
          }}
        >
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              sx={{ textTransform: 'none', color: 'var(--accent-primary)' }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        {/* Notification List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 48, color: 'var(--text-muted)', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0, maxHeight: 360, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: notification.isRead ? 'transparent' : 'var(--bg-elevated)',
                    '&:hover': {
                      backgroundColor: 'var(--sidebar-item-hover)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                        sx={{ color: 'var(--text-primary)' }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'var(--text-secondary)',
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'var(--text-muted)' }}
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notification.isRead && (
                    <Circle sx={{ fontSize: 8, color: 'var(--accent-primary)', ml: 1 }} />
                  )}
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider sx={{ borderColor: 'var(--border)' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;
