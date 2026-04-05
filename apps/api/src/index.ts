import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiLimiter, authLimiter, searchLimiter, automationLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { shopsRouter } from './modules/shops/shops.routes.js';
import { panoramaRouter } from './modules/panorama/panorama.routes.js';
import { deskRouter } from './modules/desk/desk.routes.js';
import { clientsRouter } from './modules/clients/clients.routes.js';
import { prescriptionsRouter } from './modules/prescriptions/prescriptions.routes.js';
import { suppliersRouter } from './modules/suppliers/suppliers.routes.js';
import { framesRouter } from './modules/frames/frames.routes.js';
import { lensesRouter } from './modules/lenses/lenses.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { atelierRouter } from './modules/atelier/atelier.routes.js';
import { stockMovementsRouter } from './modules/stock-movements/stock-movements.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { activityLogsRouter } from './modules/activity-logs/activity-logs.routes.js';
import { superadminRouter } from './modules/superadmin/superadmin.routes.js';
import { appointmentsRouter } from './modules/appointments/appointments.routes.js';
import stockRouter from './modules/stock/stock.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { automationRouter } from './modules/automation/automation.routes.js';
import logger from './lib/logger.js';
import { UPLOAD_DIR } from './middleware/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers (basic implementation - can add helmet when dependencies are installed)
app.disable('x-powered-by');

// CORS configuration - allow ngrok domains and localhost
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Allow localhost and ngrok domains
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.ngrok-free.app') ||
      origin.endsWith('.ngrok-free.dev') ||
      origin.endsWith('.ngrok.io') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use('/api', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve static files from public directory (panorama images, etc.)
app.use(express.static(path.join(process.cwd(), 'public')));

// Health check (no rate limit)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/search', searchLimiter, searchRouter);
app.use('/api/automation', automationLimiter, automationRouter);

// Standard routes
app.use('/api/users', usersRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/panorama', panoramaRouter);
app.use('/api/desk', deskRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/frames', framesRouter);
app.use('/api/lenses', lensesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/atelier', atelierRouter);
app.use('/api/stock-movements', stockMovementsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/activity-logs', activityLogsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/superadmin', superadminRouter);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, '🚀 VisionDesk API started');
});

export default app;
