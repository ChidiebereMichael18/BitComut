import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { studentsRouter } from './modules/students/routes';
import { invoicesRouter } from './modules/invoices/routes';
import { paymentsRouter } from './modules/payments/routes';
import { settlementRouter } from './modules/settlements/routes';
import { settlementsRouter } from './modules/settlements/settlements-routes';
import { receiptsRouter } from './modules/receipts/routes';
import { dashboardRouter } from './modules/dashboard/routes';
import { universityRouter } from './modules/university/routes';
import { tenantsRouter } from './modules/tenants/routes';
import { webhooksRouter } from './modules/webhooks/routes';
import { authRouter } from './modules/auth/routes';
import { studentRouter } from './modules/student-auth/routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(cookieParser());

  // Capture raw body for webhook signature verification.
  const jsonParser = express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  });
  app.use(jsonParser);

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const importLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Health endpoint (no tenant required)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // LNbits webhooks (no tenant cookie; verified separately + rate limited)
  app.use('/webhooks', webhooksRouter);

  // All API routes are tenant-scoped.
  app.use('/api', apiLimiter, tenantMiddleware);
  // Auth is public (no tenant yet): rate limited above, tenant cookie optional.
  app.use('/api/auth', authRouter);
  // Student portal auth (register/login) + student-scoped data.
  app.use('/api/student', studentRouter);
  // Apply the stricter import rate limit to the CSV import endpoint.
  app.use('/api/students/import', importLimiter);
  app.use('/api/tenants', tenantsRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/invoices', invoicesRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/settlement', settlementRouter);
  app.use('/api/settlements', settlementsRouter);
  app.use('/api/receipts', receiptsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/university', universityRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
