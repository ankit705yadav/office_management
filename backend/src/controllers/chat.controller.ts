import { Request, Response } from 'express';
import { Op, literal, col } from 'sequelize';
import {
  User,
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  ChatAttachment,
  ChatUserStatus,
} from '../models';
import { ConversationType, MessageType } from '../types/enums';
import { uploadToS3, getSignedDownloadUrl } from '../services/storage.service';
import { emitToConversation } from '../services/socket.service';
import logger from '../utils/logger';

/**
 * Get all conversations for the current user
 * GET /api/chat/conversations
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    logger.debug(`Fetching conversations for user ${userId}`);

    // Find all conversation IDs where user is a participant
    const participations = await ChatParticipant.findAll({
      where: { userId },
      attributes: ['conversationId'],
    });

    logger.debug(`Found ${participations.length} participations: ${JSON.stringify(participations.map(p => p.conversationId))}`);

    const conversationIds = participations.map((p) => p.conversationId);

    if (conversationIds.length === 0) {
      logger.debug('No conversation IDs found, returning empty array');
      res.status(200).json({
        status: 'success',
        data: { conversations: [] },
      });
      return;
    }

    logger.debug(`Conversation IDs: ${conversationIds.join(', ')}`);

    // Get conversations with participants and last message
    const conversations = await ChatConversation.findAll({
      where: { id: conversationIds },
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [[literal('"ChatConversation"."updated_at"'), 'DESC']],
    });

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await ChatMessage.findOne({
          where: { conversationId: conv.id, isDeleted: false },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
          order: [['id', 'DESC']],
        });

        // Get user's participant record for last_read_at
        const userParticipant = await ChatParticipant.findOne({
          where: { conversationId: conv.id, userId },
        });

        // Count unread messages - use literal for created_at to avoid column name issue
        const lastReadAt = userParticipant?.lastReadAt || new Date(0);
        const unreadCount = await ChatMessage.count({
          where: {
            conversationId: conv.id,
            isDeleted: false,
            senderId: { [Op.ne]: userId },
            [Op.and]: [
              literal(`"ChatMessage"."created_at" > '${lastReadAt.toISOString()}'`),
            ],
          },
        });

        // For direct conversations, get the other user's info
        let displayName = conv.name;
        let displayAvatar = conv.avatarUrl;

        if (conv.type === ConversationType.DIRECT) {
          const otherParticipant = (conv as any).participants?.find(
            (p: any) => p.userId !== userId
          );
          if (otherParticipant?.user) {
            displayName = `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
            displayAvatar = otherParticipant.user.profileImageUrl;
          }
        }

        return {
          id: conv.id,
          name: displayName,
          type: conv.type,
          avatarUrl: displayAvatar,
          participants: (conv as any).participants,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                messageType: lastMessage.messageType,
                sender: (lastMessage as any).sender,
                createdAt: lastMessage.createdAt?.toISOString() || (lastMessage as any).created_at || new Date().toISOString(),
              }
            : null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: { conversations: conversationsWithDetails },
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations',
    });
  }
};

/**
 * Create a new conversation
 * POST /api/chat/conversations
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { participantIds, name, type = ConversationType.DIRECT } = req.body;

    // Validate participants
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Participant IDs are required',
      });
      return;
    }

    // Include current user in participants
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    // For direct chats, check if conversation already exists
    if (type === ConversationType.DIRECT && allParticipantIds.length === 2) {
      const existingConversation = await findExistingDirectConversation(
        allParticipantIds[0],
        allParticipantIds[1]
      );

      if (existingConversation) {
        res.status(200).json({
          status: 'success',
          message: 'Conversation already exists',
          data: { conversation: existingConversation },
        });
        return;
      }
    }

    // Validate that all participants exist
    const users = await User.findAll({
      where: { id: allParticipantIds },
      attributes: ['id'],
    });

    if (users.length !== allParticipantIds.length) {
      res.status(400).json({
        status: 'error',
        message: 'One or more participants not found',
      });
      return;
    }

    // Create conversation
    const conversation = await ChatConversation.create({
      name: type === ConversationType.GROUP ? name : null,
      type,
      createdBy: userId,
    });

    // Add participants
    const participantRecords = allParticipantIds.map((pId) => ({
      conversationId: conversation.id,
      userId: pId,
      isAdmin: pId === userId,
    }));

    await ChatParticipant.bulkCreate(participantRecords);

    // Fetch the complete conversation with participants
    const fullConversation = await ChatConversation.findByPk(conversation.id, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
            },
          ],
        },
      ],
    });

    // For direct conversations, compute the display name from the other participant
    let displayName = fullConversation?.name;
    let displayAvatar = fullConversation?.avatarUrl;

    if (type === ConversationType.DIRECT && fullConversation) {
      const otherParticipant = (fullConversation as any).participants?.find(
        (p: any) => p.userId !== userId
      );
      if (otherParticipant?.user) {
        displayName = `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
        displayAvatar = otherParticipant.user.profileImageUrl;
      }
    }

    const responseConversation = {
      ...fullConversation?.toJSON(),
      name: displayName,
      avatarUrl: displayAvatar,
    };

    logger.info(`Conversation created: ${conversation.id} by user: ${userId}`);

    res.status(201).json({
      status: 'success',
      message: 'Conversation created successfully',
      data: { conversation: responseConversation },
    });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create conversation',
    });
  }
};

/**
 * Get a single conversation by ID
 * GET /api/chat/conversations/:id
 */
export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = parseInt(req.params.id);

    // Check if user is a participant
    const isParticipant = await ChatParticipant.findOne({
      where: { conversationId, userId },
    });

    if (!isParticipant) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this conversation',
      });
      return;
    }

    const conversation = await ChatConversation.findByPk(conversationId, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!conversation) {
      res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { conversation },
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation',
    });
  }
};

/**
 * Get messages for a conversation (paginated)
 * GET /api/chat/conversations/:id/messages
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = parseInt(req.params.id);
    const { cursor, limit = 50 } = req.query;

    // Check if user is a participant
    const isParticipant = await ChatParticipant.findOne({
      where: { conversationId, userId },
    });

    if (!isParticipant) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this conversation',
      });
      return;
    }

    // Build query
    const whereClause: any = {
      conversationId,
      isDeleted: false,
    };

    if (cursor) {
      whereClause.id = { [Op.lt]: parseInt(cursor as string) };
    }

    const messages = await ChatMessage.findAll({
      where: whereClause,
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
      order: [['id', 'DESC']],
      limit: parseInt(limit as string) + 1, // Fetch one extra to check if there are more
    });

    const hasMore = messages.length > parseInt(limit as string);
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? resultMessages[resultMessages.length - 1].id : null;

    // Generate signed URLs for attachments
    const messagesWithUrls = await Promise.all(
      resultMessages.map(async (msg) => {
        const attachments = await Promise.all(
          ((msg as any).attachments || []).map(async (att: ChatAttachment) => ({
            ...att.toJSON(),
            url: await getSignedDownloadUrl(att.s3Key),
            thumbnailUrl: att.thumbnailKey ? await getSignedDownloadUrl(att.thumbnailKey) : null,
          }))
        );
        return {
          ...msg.toJSON(),
          attachments,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        messages: messagesWithUrls.reverse(), // Return in chronological order
        pagination: {
          hasMore,
          nextCursor,
        },
      },
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages',
    });
  }
};

/**
 * Send a message
 * POST /api/chat/conversations/:id/messages
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = parseInt(req.params.id);
    const { content, messageType = MessageType.TEXT, replyToId, attachmentIds } = req.body;

    // Check if user is a participant
    const isParticipant = await ChatParticipant.findOne({
      where: { conversationId, userId },
    });

    if (!isParticipant) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this conversation',
      });
      return;
    }

    // Validate content or attachments
    if (!content && (!attachmentIds || attachmentIds.length === 0)) {
      res.status(400).json({
        status: 'error',
        message: 'Message content or attachments are required',
      });
      return;
    }

    // Create message
    const message = await ChatMessage.create({
      conversationId,
      senderId: userId,
      content,
      messageType,
      replyToId: replyToId || null,
    });

    // Link attachments if provided
    if (attachmentIds && attachmentIds.length > 0) {
      await ChatAttachment.update(
        { messageId: message.id },
        { where: { id: attachmentIds } }
      );
    }

    // Update conversation's updatedAt
    await ChatConversation.update(
      { updatedAt: new Date() },
      { where: { id: conversationId } }
    );

    // Fetch the complete message with relations
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

    // Broadcast to all participants via Socket.io
    try {
      emitToConversation(conversationId, 'new_message', messageData);
    } catch (socketError) {
      logger.warn('Socket emission failed (socket might not be initialized):', socketError);
    }

    logger.info(`Message sent: ${message.id} in conversation: ${conversationId}`);

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: { message: messageData },
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
    });
  }
};

/**
 * Delete a message
 * DELETE /api/chat/messages/:id
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const messageId = parseInt(req.params.id);

    const message = await ChatMessage.findByPk(messageId);

    if (!message) {
      res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
      return;
    }

    // Only sender can delete their message
    if (message.senderId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'You can only delete your own messages',
      });
      return;
    }

    // Soft delete
    await message.update({ isDeleted: true, content: '' });

    logger.info(`Message deleted: ${messageId} by user: ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message',
    });
  }
};

/**
 * Mark conversation as read
 * POST /api/chat/conversations/:id/read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = parseInt(req.params.id);

    const participant = await ChatParticipant.findOne({
      where: { conversationId, userId },
    });

    if (!participant) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this conversation',
      });
      return;
    }

    await participant.update({ lastReadAt: new Date() });

    res.status(200).json({
      status: 'success',
      message: 'Conversation marked as read',
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark conversation as read',
    });
  }
};

/**
 * Upload chat attachment
 * POST /api/chat/upload
 */
export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        status: 'error',
        message: 'No file provided',
      });
      return;
    }

    // Upload to S3 with chat-specific path
    const result = await uploadToS3(file, userId);

    // Create attachment record (will be linked to message later)
    const attachment = await ChatAttachment.create({
      messageId: 0, // Will be updated when message is sent
      fileName: file.originalname,
      fileSize: file.size,
      fileType: result.fileType,
      mimeType: result.mimeType,
      s3Key: result.s3Key,
    });

    const signedUrl = await getSignedDownloadUrl(result.s3Key);

    logger.info(`Chat attachment uploaded: ${attachment.id} by user: ${userId}`);

    res.status(201).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        attachment: {
          id: attachment.id,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          fileType: attachment.fileType,
          url: signedUrl,
        },
      },
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload file',
    });
  }
};

/**
 * Search users to start a chat
 * GET /api/chat/users/search
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { q, limit = 20 } = req.query;

    if (!q || (q as string).length < 2) {
      res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    const searchTerm = `%${q}%`;

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        status: 'active',
        [Op.or]: [
          { firstName: { [Op.iLike]: searchTerm } },
          { lastName: { [Op.iLike]: searchTerm } },
          { email: { [Op.iLike]: searchTerm } },
          literal(`CONCAT(first_name, ' ', last_name) ILIKE '${searchTerm}'`),
        ],
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search users',
    });
  }
};

/**
 * Register device token for push notifications
 * POST /api/chat/device-token
 */
export const registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token, platform } = req.body;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Device token is required',
      });
      return;
    }

    await ChatUserStatus.upsert({
      userId,
      deviceToken: token,
      platform,
      isOnline: true,
      lastSeenAt: new Date(),
    });

    logger.info(`Device token registered for user: ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Device token registered successfully',
    });
  } catch (error) {
    logger.error('Register device token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register device token',
    });
  }
};

// Helper function to find existing direct conversation between two users
// Returns a formatted conversation object with displayName and lastMessage
async function findExistingDirectConversation(
  userId1: number,
  userId2: number
): Promise<any | null> {
  // Find conversations where both users are participants
  const user1Participations = await ChatParticipant.findAll({
    where: { userId: userId1 },
    attributes: ['conversationId'],
  });

  const user1ConversationIds = user1Participations.map((p) => p.conversationId);

  if (user1ConversationIds.length === 0) {
    return null;
  }

  const commonConversation = await ChatConversation.findOne({
    where: {
      id: user1ConversationIds,
      type: ConversationType.DIRECT,
    },
    include: [
      {
        model: ChatParticipant,
        as: 'participants',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
          },
        ],
      },
    ],
  });

  if (!commonConversation) {
    return null;
  }

  // Get the other participant to compute display name
  const otherParticipant = (commonConversation as any).participants?.find(
    (p: any) => p.userId !== userId1
  );

  let displayName = commonConversation.name;
  let displayAvatar = commonConversation.avatarUrl;

  if (otherParticipant?.user) {
    displayName = `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    displayAvatar = otherParticipant.user.profileImageUrl;
  }

  // Get last message for this conversation
  const lastMessage = await ChatMessage.findOne({
    where: { conversationId: commonConversation.id, isDeleted: false },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    order: [['id', 'DESC']],
  });

  return {
    ...commonConversation.toJSON(),
    name: displayName,
    avatarUrl: displayAvatar,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.content,
          messageType: lastMessage.messageType,
          sender: (lastMessage as any).sender,
          createdAt: lastMessage.createdAt?.toISOString() || (lastMessage as any).created_at || new Date().toISOString(),
        }
      : null,
  };
}
