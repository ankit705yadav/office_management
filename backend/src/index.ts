import { createServer } from 'http';
import app from './app';
import config from './config/environment';
import { connectDatabase } from './config/database';
import logger from './utils/logger';
import { startCronJobs, stopCronJobs } from './services/cron.service';
import { initializeSocketServer } from './services/socket.service';
import { initializeFirebase } from './services/push.service';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(error.name, error.message);
  logger.error(error.stack);
  process.exit(1);
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Firebase for push notifications
    initializeFirebase();

    // Create HTTP server for Express + Socket.io
    const httpServer = createServer(app);

    // Initialize Socket.io
    const corsOrigins = config.corsOrigin.split(',').map((origin) => origin.trim());
    initializeSocketServer(httpServer, corsOrigins);

    // Start HTTP server (Express + Socket.io)
    httpServer.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Operation Management API Server                         ║
║                                                               ║
║   Environment: ${config.nodeEnv.padEnd(46)} ║
║   Port:        ${config.port.toString().padEnd(46)} ║
║   Host:        ${config.host.padEnd(46)} ║
║   Database:    ${config.database.name.padEnd(46)} ║
║   Socket.io:   Enabled${' '.repeat(40)} ║
║                                                               ║
║   API URL:     http://${config.host}:${config.port}/api${' '.repeat(23)} ║
║   Health:      http://${config.host}:${config.port}/health${' '.repeat(20)} ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);

      // Start cron jobs
      startCronJobs();
    });

    const server = httpServer;

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(reason.name, reason.message);
      logger.error(reason.stack);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      stopCronJobs();
      server.close(() => {
        logger.info('Process terminated');
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      stopCronJobs();
      server.close(() => {
        logger.info('Process terminated');
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
