import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  // Server
  nodeEnv: string;
  port: number;
  host: string;

  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
  };

  // JWT
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };

  // AWS
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
    sesRegion?: string;
  };

  // Email
  email: {
    from: string;
    fromName: string;
  };

  // File Upload
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };

  // CORS
  corsOrigin: string;

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Logging
  logLevel: string;

  // Cron
  enableCronJobs: boolean;

  // URLs
  frontendUrl: string;
  backendUrl: string;

  // Firebase (Push Notifications)
  firebase?: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };

  // Socket.io
  socketPort?: number;
}

const config: EnvironmentConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || 'localhost',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'office_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    url: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/office_management',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'company-operation-mgmt',
    sesRegion: process.env.AWS_SES_REGION || 'us-east-1',
  },

  email: {
    from: process.env.EMAIL_FROM || 'noreply@company.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Company Name',
  },

  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
  },

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per minute for dev
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  enableCronJobs: process.env.ENABLE_CRON_JOBS === 'true',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',

  firebase: process.env.FIREBASE_PROJECT_ID
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
      }
    : undefined,

  socketPort: parseInt(process.env.SOCKET_PORT || '0', 10) || undefined,
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
  ];

  // AWS is optional - only required if using S3 for file uploads
  const optionalEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const missingOptional = optionalEnvVars.filter((varName) => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn(`Warning: Optional environment variables not set: ${missingOptional.join(', ')}. Some features may be disabled.`);
  }
}

export default config;
