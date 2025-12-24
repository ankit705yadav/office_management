import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
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
  const [mentionAnchor, setMentionAnchor] = useState<null | HTMLElement>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionInputRef, setMentionInputRef] = useState<'new' | 'reply' | 'edit'>('new');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleMentionSelect = (user: User) => {
    const mention = `@[${user.id}:${user.firstName} ${user.lastName}] `;
    if (mentionInputRef === 'new') {
      setNewComment((prev) => prev.replace(/@\w*$/, '') + mention);
    } else if (mentionInputRef === 'reply') {
      setReplyText((prev) => prev.replace(/@\w*$/, '') + mention);
    } else if (mentionInputRef === 'edit') {
      setEditText((prev) => prev.replace(/@\w*$/, '') + mention);
    }
    setMentionAnchor(null);
    setMentionSearch('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    inputType: 'new' | 'reply' | 'edit'
  ) => {
    const value = e.target.value;
    const setter =
      inputType === 'new' ? setNewComment : inputType === 'reply' ? setReplyText : setEditText;
    setter(value);

    // Check for @ mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('[')) {
        setMentionSearch(textAfterAt);
        setMentionInputRef(inputType);
        setMentionAnchor(e.target as HTMLElement);
        return;
      }
    }
    setMentionAnchor(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      u.lastName.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const renderMentions = (content: string, mentions: number[]) => {
    // Parse @[id:name] pattern and render as chips
    const parts = content.split(/(@\[\d+:[^\]]+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/@\[(\d+):([^\]]+)\]/);
      if (match) {
        const userId = parseInt(match[1]);
        const userName = match[2];
        return (
          <Chip
            key={i}
            label={`@${userName}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mx: 0.25, fontSize: 12, height: 20 }}
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
                <TextField
                  fullWidth
                  multiline
                  size="small"
                  value={editText}
                  onChange={(e) => handleInputChange(e, 'edit')}
                  placeholder="Edit comment..."
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
              <TextField
                fullWidth
                size="small"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => handleInputChange(e, 'reply')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment(comment.id);
                  }
                }}
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
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
            {currentUser?.firstName?.[0]}
            {currentUser?.lastName?.[0]}
          </Avatar>
          <TextField
            ref={inputRef}
            fullWidth
            size="small"
            placeholder="Write a comment... (use @ to mention)"
            value={newComment}
            onChange={(e) => handleInputChange(e, 'new')}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            multiline
            maxRows={4}
          />
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

      {/* Mention menu */}
      <Menu
        anchorEl={mentionAnchor}
        open={Boolean(mentionAnchor)}
        onClose={() => setMentionAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {filteredUsers.length === 0 ? (
          <MenuItem disabled>No users found</MenuItem>
        ) : (
          filteredUsers.slice(0, 5).map((user) => (
            <MenuItem key={user.id} onClick={() => handleMentionSelect(user)}>
              <Avatar
                src={user.profileImageUrl}
                sx={{ width: 24, height: 24, fontSize: 10, mr: 1 }}
              >
                {user.firstName[0]}
                {user.lastName[0]}
              </Avatar>
              {user.firstName} {user.lastName}
            </MenuItem>
          ))
        )}
      </Menu>

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
