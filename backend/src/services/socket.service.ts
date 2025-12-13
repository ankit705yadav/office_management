import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/environment';
import logger from '../utils/logger';

let io: Server | null = null;

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * Initialize Socket.io server
 */
export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin.split(',').map(origin => origin.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      socket.data.role = decoded.role;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;

    // Join user to their personal room
    socket.join(`user_${userId}`);
    logger.info(`Socket connected: User ${userId} (${socket.id})`);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: User ${userId} (${socket.id}) - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};

/**
 * Get the Socket.io server instance
 */
export const getIO = (): Server | null => {
  return io;
};

/**
 * Emit an event to a specific user
 */
export const emitToUser = (userId: number, event: string, data: any): void => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
    logger.debug(`Emitted ${event} to user ${userId}`);
  } else {
    logger.warn('Socket.io not initialized, cannot emit event');
  }
};

/**
 * Emit an event to multiple users
 */
export const emitToUsers = (userIds: number[], event: string, data: any): void => {
  if (io) {
    userIds.forEach(userId => {
      io!.to(`user_${userId}`).emit(event, data);
    });
    logger.debug(`Emitted ${event} to ${userIds.length} users`);
  } else {
    logger.warn('Socket.io not initialized, cannot emit event');
  }
};

/**
 * Broadcast an event to all connected users
 */
export const broadcast = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
    logger.debug(`Broadcast ${event} to all users`);
  } else {
    logger.warn('Socket.io not initialized, cannot broadcast');
  }
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToUsers,
  broadcast,
};
