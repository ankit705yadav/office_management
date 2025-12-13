import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Op } from 'sequelize';
import { verifyAccessToken } from '../utils/jwt';
import {
  User,
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  ChatAttachment,
  ChatUserStatus,
} from '../models';
import { MessageType } from '../types/enums';
import { getSignedDownloadUrl } from './storage.service';
import { sendPushNotification } from './push.service';
import logger from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId: number;
  userEmail: string;
}

let io: Server;

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: HttpServer, corsOrigins: string[]): Server {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }

      // Check if user exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user || user.status !== 'active') {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      (socket as AuthenticatedSocket).userId = decoded.userId;
      (socket as AuthenticatedSocket).userEmail = decoded.email;

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;

    logger.info(`Socket connected: ${socket.id} for user: ${userId}`);

    // Update user online status
    await updateUserOnlineStatus(userId, true);

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // Join all conversation rooms the user is part of
    const participations = await ChatParticipant.findAll({
      where: { userId },
      attributes: ['conversationId'],
    });

    participations.forEach((p) => {
      socket.join(`conversation:${p.conversationId}`);
    });

    // Broadcast online status to relevant users
    broadcastUserStatus(userId, true);

    // Event handlers
    socket.on('join_conversation', async (data: { conversationId: number }) => {
      await handleJoinConversation(authSocket, data.conversationId);
    });

    socket.on('leave_conversation', async (data: { conversationId: number }) => {
      socket.leave(`conversation:${data.conversationId}`);
    });

    socket.on('send_message', async (data: {
      conversationId: number;
      content: string;
      messageType?: MessageType;
      replyToId?: number;
      attachmentIds?: number[];
    }) => {
      await handleSendMessage(authSocket, data);
    });

    socket.on('typing_start', async (data: { conversationId: number }) => {
      await handleTyping(authSocket, data.conversationId, true);
    });

    socket.on('typing_stop', async (data: { conversationId: number }) => {
      await handleTyping(authSocket, data.conversationId, false);
    });

    socket.on('mark_read', async (data: { conversationId: number }) => {
      await handleMarkRead(authSocket, data.conversationId);
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} for user: ${userId}`);
      await updateUserOnlineStatus(userId, false);
      broadcastUserStatus(userId, false);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

/**
 * Get Socket.io server instance
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Update user online status in database
 */
async function updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
  try {
    await ChatUserStatus.upsert({
      userId,
      isOnline,
      lastSeenAt: new Date(),
    });
  } catch (error) {
    logger.error('Update online status error:', error);
  }
}

/**
 * Broadcast user online/offline status to relevant users
 */
async function broadcastUserStatus(userId: number, isOnline: boolean): Promise<void> {
  try {
    // Find all conversations the user is part of
    const participations = await ChatParticipant.findAll({
      where: { userId },
      attributes: ['conversationId'],
    });

    const conversationIds = participations.map((p) => p.conversationId);

    // Get all other participants in these conversations
    const otherParticipants = await ChatParticipant.findAll({
      where: {
        conversationId: conversationIds,
        userId: { [Op.ne]: userId },
      },
      attributes: ['userId'],
      group: ['userId'],
    });

    // Emit to each user's personal room
    otherParticipants.forEach((p) => {
      io.to(`user:${p.userId}`).emit('user_online', {
        userId,
        isOnline,
        lastSeenAt: new Date(),
      });
    });
  } catch (error) {
    logger.error('Broadcast user status error:', error);
  }
}

/**
 * Handle join conversation event
 */
async function handleJoinConversation(socket: AuthenticatedSocket, conversationId: number): Promise<void> {
  try {
    // Verify user is a participant
    const participant = await ChatParticipant.findOne({
      where: { conversationId, userId: socket.userId },
    });

    if (participant) {
      socket.join(`conversation:${conversationId}`);
      logger.debug(`User ${socket.userId} joined conversation ${conversationId}`);
    }
  } catch (error) {
    logger.error('Join conversation error:', error);
  }
}

/**
 * Handle send message event
 */
async function handleSendMessage(
  socket: AuthenticatedSocket,
  data: {
    conversationId: number;
    content: string;
    messageType?: MessageType;
    replyToId?: number;
    attachmentIds?: number[];
  }
): Promise<void> {
  try {
    const { conversationId, content, messageType = MessageType.TEXT, replyToId, attachmentIds } = data;

    // Verify user is a participant
    const participant = await ChatParticipant.findOne({
      where: { conversationId, userId: socket.userId },
    });

    if (!participant) {
      socket.emit('error', { message: 'Not a participant in this conversation' });
      return;
    }

    // Create message
    const message = await ChatMessage.create({
      conversationId,
      senderId: socket.userId,
      content,
      messageType,
      replyToId: replyToId || undefined,
    });

    // Link attachments if provided
    if (attachmentIds && attachmentIds.length > 0) {
      await ChatAttachment.update(
        { messageId: message.id },
        { where: { id: attachmentIds } }
      );
    }

    // Update conversation timestamp
    await ChatConversation.update(
      { updatedAt: new Date() },
      { where: { id: conversationId } }
    );

    // Fetch complete message with relations
    const fullMessage = await ChatMessage.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
        },
        {
          model: ChatAttachment,
          as: 'attachments',
        },
        {
          model: ChatMessage,
          as: 'replyTo',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    // Generate signed URLs for attachments
    const attachments = await Promise.all(
      ((fullMessage as any).attachments || []).map(async (att: ChatAttachment) => ({
        ...att.toJSON(),
        url: await getSignedDownloadUrl(att.s3Key),
        thumbnailUrl: att.thumbnailKey ? await getSignedDownloadUrl(att.thumbnailKey) : null,
      }))
    );

    const messageData = {
      ...fullMessage?.toJSON(),
      attachments,
    };

    // Emit to all participants in the conversation
    io.to(`conversation:${conversationId}`).emit('new_message', messageData);

    // Send push notifications to offline participants
    await sendPushToOfflineParticipants(conversationId, socket.userId, messageData);

    logger.debug(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
  } catch (error) {
    logger.error('Send message error:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
}

/**
 * Handle typing event
 */
async function handleTyping(
  socket: AuthenticatedSocket,
  conversationId: number,
  isTyping: boolean
): Promise<void> {
  try {
    // Broadcast to other participants (not sender)
    socket.to(`conversation:${conversationId}`).emit('typing', {
      conversationId,
      userId: socket.userId,
      isTyping,
    });
  } catch (error) {
    logger.error('Typing event error:', error);
  }
}

/**
 * Handle mark read event
 */
async function handleMarkRead(socket: AuthenticatedSocket, conversationId: number): Promise<void> {
  try {
    await ChatParticipant.update(
      { lastReadAt: new Date() },
      { where: { conversationId, userId: socket.userId } }
    );

    // Emit read receipt to other participants
    socket.to(`conversation:${conversationId}`).emit('message_read', {
      conversationId,
      userId: socket.userId,
      readAt: new Date(),
    });
  } catch (error) {
    logger.error('Mark read error:', error);
  }
}

/**
 * Send push notifications to offline participants
 */
async function sendPushToOfflineParticipants(
  conversationId: number,
  senderId: number,
  message: any
): Promise<void> {
  try {
    // Get all participants except sender
    const participants = await ChatParticipant.findAll({
      where: {
        conversationId,
        userId: { [Op.ne]: senderId },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    // Get sender info
    const sender = await User.findByPk(senderId, {
      attributes: ['firstName', 'lastName'],
    });

    // Get conversation for title
    const conversation = await ChatConversation.findByPk(conversationId);

    for (const participant of participants) {
      // Check if user is offline
      const userStatus = await ChatUserStatus.findByPk(participant.userId);

      if (userStatus && !userStatus.isOnline && userStatus.deviceToken) {
        const title = conversation?.name || `${sender?.firstName} ${sender?.lastName}`;
        const body = message.content?.substring(0, 100) || 'Sent an attachment';

        await sendPushNotification(userStatus.deviceToken, {
          title,
          body,
          data: {
            type: 'chat_message',
            conversationId: conversationId.toString(),
            messageId: message.id.toString(),
          },
        });
      }
    }
  } catch (error) {
    logger.error('Send push notifications error:', error);
  }
}

/**
 * Emit event to specific conversation
 */
export function emitToConversation(conversationId: number, event: string, data: any): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId: number, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export default {
  initializeSocketServer,
  getIO,
  emitToConversation,
  emitToUser,
};
