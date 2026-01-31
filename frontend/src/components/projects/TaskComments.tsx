import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
} from '@mui/material';
import MentionInput from './MentionInput';
import {
  Send,
  Edit,
  Delete,
  Reply,
  MoreVert,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import { projectService, TaskComment } from '../../services/project.service';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

interface TaskCommentsProps {
  taskId: number;
  canComment: boolean;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, canComment }) => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCommentId, setMenuCommentId] = useState<number | null>(null);

  useEffect(() => {
    loadComments();
    loadUsers();
  }, [taskId]);

  // Real-time comment updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = (data: { taskId: number; comment: TaskComment }) => {
      if (data.taskId === taskId) {
        // Add new comment or reply
        if (data.comment.parentId) {
          // It's a reply - add to parent's replies
          setComments((prev) =>
            prev.map((c) =>
              c.id === data.comment.parentId
                ? { ...c, replies: [...(c.replies || []), data.comment] }
                : c
            )
          );
        } else {
          // Top-level comment - add to beginning
          setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
        }
      }
    };

    const handleCommentUpdated = (data: { taskId: number; comment: TaskComment }) => {
      if (data.taskId === taskId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === data.comment.id) {
              return { ...data.comment, replies: c.replies };
            }
            // Check replies
            if (c.replies?.some((r) => r.id === data.comment.id)) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === data.comment.id ? data.comment : r
                ),
              };
            }
            return c;
          })
        );
      }
    };

    const handleCommentDeleted = (data: { taskId: number; commentId: number }) => {
      if (data.taskId === taskId) {
        setComments((prev) => {
          // Remove top-level comment or reply
          const filtered = prev.filter((c) => c.id !== data.commentId);
          return filtered.map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== data.commentId) || [],
          }));
        });
      }
    };

    socket.on('taskCommentAdded', handleCommentAdded);
    socket.on('taskCommentUpdated', handleCommentUpdated);
    socket.on('taskCommentDeleted', handleCommentDeleted);

    return () => {
      socket.off('taskCommentAdded', handleCommentAdded);
      socket.off('taskCommentUpdated', handleCommentUpdated);
      socket.off('taskCommentDeleted', handleCommentDeleted);
    };
  }, [socket, taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await projectService.getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Use a public endpoint that employees can access for @mentions
      const response = await api.get('/users/list-basic', { params: { status: 'active', limit: 100 } });
      setUsers(response.data || []);
    } catch (error) {
      // Fallback - ignore if user can't fetch users list (employees may not have permission)
      console.log('Could not load users for mentions');
    }
  };

  const handleSubmitComment = async (parentId?: number) => {
    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await projectService.createTaskComment(taskId, content, parentId);
      toast.success(parentId ? 'Reply added' : 'Comment added');
      setNewComment('');
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editText.trim()) return;

    try {
      setSubmitting(true);
      await projectService.updateTaskComment(taskId, commentId, editText);
      toast.success('Comment updated');
      setEditingId(null);
      setEditText('');
      await loadComments();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error(error.response?.data?.message || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await projectService.deleteTaskComment(taskId, commentId);
      toast.success('Comment deleted');
      setMenuAnchor(null);
      setMenuCommentId(null);
      await loadComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const renderMentions = (content: string, _mentions: number[]) => {
    // Parse @[id:name] pattern and render as tag-like chips (name only, no id)
    const parts = content.split(/(@\[\d+:[^\]]+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/@\[(\d+):([^\]]+)\]/);
      if (match) {
        const userName = match[2];
        return (
          <Chip
            key={i}
            label={`@${userName}`}
            size="small"
            variant="outlined"
            sx={{
              mx: 0.25,
              fontSize: 12,
              height: 22,
              fontWeight: 500,
              borderColor: 'primary.main',
              backgroundColor: 'primary.lighter',
              color: 'text.primary',
              '& .MuiChip-label': {
                color: 'text.primary',
              },
            }}
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderComment = (comment: TaskComment, isReply = false) => {
    const isOwner = currentUser?.id === comment.userId;
    const canModify = isOwner || currentUser?.role === 'admin';

    return (
      <Box
        key={comment.id}
        sx={{
          display: 'flex',
          gap: 1,
          ml: isReply ? 4 : 0,
          mb: 1.5,
        }}
      >
        <Avatar
          src={comment.author?.profileImageUrl}
          sx={{ width: 32, height: 32, fontSize: 12 }}
        >
          {comment.author?.firstName?.[0]}
          {comment.author?.lastName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              backgroundColor: isOwner ? 'primary.lighter' : 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2" component="span">
                  {comment.author?.firstName} {comment.author?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {comment.createdAt && !isNaN(new Date(comment.createdAt).getTime())
                    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                    : 'just now'}
                  {comment.isEdited && comment.editedAt && !isNaN(new Date(comment.editedAt).getTime()) && (
                    <Tooltip title={`Edited ${format(new Date(comment.editedAt), 'MMM d, HH:mm')}`}>
                      <span> (edited)</span>
                    </Tooltip>
                  )}
                </Typography>
              </Box>
              {canModify && !editingId && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setMenuAnchor(e.currentTarget);
                    setMenuCommentId(comment.id);
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>

            {editingId === comment.id ? (
              <Box sx={{ mt: 1 }}>
                <MentionInput
                  value={editText}
                  onChange={setEditText}
                  placeholder="Edit comment..."
                  users={users}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingId(null);
                      setEditText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={submitting}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {renderMentions(comment.content, comment.mentions)}
              </Typography>
            )}
          </Paper>

          {/* Reply action */}
          {canComment && !isReply && !editingId && (
            <Button
              size="small"
              startIcon={<Reply fontSize="small" />}
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                setReplyText('');
              }}
              sx={{ mt: 0.5, textTransform: 'none' }}
            >
              Reply
            </Button>
          )}

          {/* Reply form */}
          {replyingTo === comment.id && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, ml: 4 }}>
              <MentionInput
                value={replyText}
                onChange={setReplyText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment(comment.id);
                  }
                }}
                placeholder="Write a reply..."
                users={users}
              />
              <IconButton
                color="primary"
                onClick={() => handleSubmitComment(comment.id)}
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? <CircularProgress size={20} /> : <Send />}
              </IconButton>
            </Box>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {comment.replies.map((reply) => renderComment(reply, true))}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CommentIcon fontSize="small" />
        Comments
        {comments.length > 0 && <Chip size="small" label={comments.length} />}
      </Typography>

      {/* New comment input */}
      {canComment && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
            {currentUser?.firstName?.[0]}
            {currentUser?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              placeholder="Write a comment... (use @ to mention)"
              users={users}
            />
          </Box>
          <IconButton
            color="primary"
            onClick={() => handleSubmitComment()}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No comments yet
        </Typography>
      ) : (
        <Box>{comments.map((comment) => renderComment(comment))}</Box>
      )}

      {/* Comment actions menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuCommentId(null);
        }}
      >
        <MenuItem
          onClick={() => {
            const comment = comments
              .flatMap((c) => [c, ...(c.replies || [])])
              .find((c) => c.id === menuCommentId);
            if (comment) {
              setEditingId(comment.id);
              setEditText(comment.content);
            }
            setMenuAnchor(null);
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCommentId) handleDeleteComment(menuCommentId);
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskComments;
