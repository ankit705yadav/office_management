import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config/environment';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import leaveRoutes from './routes/leave.routes';
import holidayRoutes from './routes/holiday.routes';
import dashboardRoutes from './routes/dashboard.routes';
import attendanceRoutes from './routes/attendance.routes';
import projectRoutes from './routes/project.routes';
import dailyReportRoutes from './routes/dailyReport.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import clientRoutes from './routes/client.routes';

const app: Application = express();

/* =========================================================
   CORS CONFIG (MUST BE FIRST)
========================================================= */

const allowedOrigins = config.corsOrigin
  .split(',')
  .map(origin => origin.trim());

console.log('Allowed CORS Origins:', allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('CORS blocked:', origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle all preflight requests
app.options('*', cors());

/* =========================================================
   SECURITY & CORE MIDDLEWARE
========================================================= */

// Helmet (disable CORP – breaks APIs)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

/* =========================================================
   LOGGING
========================================================= */

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    })
  );
}

/* =========================================================
   RATE LIMITING (SKIP OPTIONS!)
========================================================= */

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return limiter(req, res, next);
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

/* =========================================================
   API INFO
========================================================= */

app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Operation Management API v1.0',
    version: '1.0.0',
  });
});

/* =========================================================
   ROUTES
========================================================= */

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/clients', clientRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

app.use(
  (err: CustomError, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;

    logger.error('ERROR', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });

    if (config.nodeEnv === 'development') {
      return res.status(statusCode).json({
        status: 'error',
        message: err.message,
        stack: err.stack,
      });
    }

    return res.status(statusCode).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
);

export default app;
