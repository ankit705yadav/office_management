import { Router } from 'express';
import multer from 'multer';
import {
  getConversations,
  createConversation,
  getConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
  uploadAttachment,
  searchUsers,
  registerDeviceToken,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (_req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Text
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// All chat routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
router.get('/conversations', getConversations);

/**
 * @route   POST /api/chat/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post('/conversations', createConversation);

/**
 * @route   GET /api/chat/conversations/:id
 * @desc    Get a single conversation by ID
 * @access  Private
 */
router.get('/conversations/:id', getConversation);

/**
 * @route   GET /api/chat/conversations/:id/messages
 * @desc    Get messages for a conversation (paginated)
 * @access  Private
 */
router.get('/conversations/:id/messages', getMessages);

/**
 * @route   POST /api/chat/conversations/:id/messages
 * @desc    Send a message to a conversation
 * @access  Private
 */
router.post('/conversations/:id/messages', sendMessage);

/**
 * @route   POST /api/chat/conversations/:id/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.post('/conversations/:id/read', markAsRead);

/**
 * @route   DELETE /api/chat/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/messages/:id', deleteMessage);

/**
 * @route   POST /api/chat/upload
 * @desc    Upload a chat attachment
 * @access  Private
 */
router.post('/upload', upload.single('file'), uploadAttachment);

/**
 * @route   GET /api/chat/users/search
 * @desc    Search users to start a chat
 * @access  Private
 */
router.get('/users/search', searchUsers);

/**
 * @route   POST /api/chat/device-token
 * @desc    Register device token for push notifications
 * @access  Private
 */
router.post('/device-token', registerDeviceToken);

export default router;
