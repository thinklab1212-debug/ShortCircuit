// ============================================================================
// ElectroKart — Logging Middleware
// ============================================================================
// Tracks the HTTP request/response cycle, measures execution duration,
// and streams logs to the Winston logger.
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/index.js';

/**
 * Traces request processing times and status codes.
 * Hooks into the response finish event to log complete summaries.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();
  const reqId = req.headers['x-request-id'] || 'system';

  // Log immediate incoming request details (optional debug level)
  logger.debug({
    message: `[REQ START] - ${req.method} ${req.originalUrl} - RequestID: ${reqId}`,
    meta: {
      method: req.method,
      url: req.originalUrl,
      requestId: reqId,
      ip: req.ip,
    },
  });

  // Track response completion
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    const logData = {
      message: `[REQ END] - ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${durationMs}ms - RequestID: ${reqId}`,
      meta: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs),
        requestId: reqId,
      },
    };

    if (res.statusCode >= 500) {
      logger.error(logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logData);
    } else {
      logger.info(logData);
    }
  });

  next();
}

export default requestLogger;
