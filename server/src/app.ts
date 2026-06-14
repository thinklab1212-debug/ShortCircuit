// ============================================================================
// ElectroKart — Express Application setup
// ============================================================================
// Registers global middlewares stack, mounts api routes, sets up Swagger docs,
// and configures health endpoints and global error catch gates.
// ============================================================================

import express from 'express';
import cors from 'cors';
import * as helmetImport from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { corsOptions } from './config/corsOptions.js';
import { setupSwagger } from './config/swagger.js';
import {
  globalErrorHandler,
  notFoundHandler,
  publicLimiter,
  requestId,
  mongoSanitizer,
  xssSanitizer,
  requestLogger,
} from './middlewares/index.js';
import apiRoutes from './routes/index.js';
import sitemapRoutes from './routes/sitemap.routes.js';
import { ApiResponse } from './utils/index.js';

// helmet ships as CommonJS; resolve its callable export across interop/version differences
const helmet: any = (helmetImport as any).default ?? helmetImport;

const app = express();

// Enable trust proxy to parse X-Forwarded-For headers behind Render/Load Balancer proxies
app.set('trust proxy', 1);

// 1. Mount Security Headers
app.use(helmet());

// 2. Enable Cross-Origin Resource Sharing (CORS)
app.use(cors(corsOptions));

// 3. Request Parsers (10kb body size limits to prevent DOS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Request Tracing & Winston logging
app.use(requestId);
app.use(requestLogger);

// 5. Input Sanitization
app.use(mongoSanitizer);
app.use(xssSanitizer);

// 6. Global Rate Limiter
app.use(publicLimiter);

// 7. Health Check Endpoints
app.get('/health', (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      uptime: process.uptime(),
      timestamp: new Date(),
      status: 'OK',
    }, 'System health details retrieved.')
  );
});

app.get('/health/live', (req, res) => {
  res.status(200).json(
    new ApiResponse(200, { status: 'alive' }, 'Liveness check passed.')
  );
});

app.get('/health/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;
  const message = isDbConnected ? 'Database ready.' : 'Database service unavailable.';
  
  res.status(statusCode).json(
    new ApiResponse(statusCode, {
      dbStatus: mongoose.connection.readyState,
      ready: isDbConnected,
    }, message)
  );
});

// 8. Swagger Interactive Docs (Mounted under /api/v1/docs)
setupSwagger(app);

// 9. Mount modular API endpoints
app.use('/api/v1', apiRoutes);

// Mount sitemap route at root for SEO crawlers (/sitemap.xml)
app.use('/', sitemapRoutes);

// 10. Route not found fallback (404)
app.use(notFoundHandler);

// 11. Centralized global error handler
app.use(globalErrorHandler);

export { app };
export default app;
