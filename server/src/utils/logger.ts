// ============================================================================
// ElectroKart — Winston Logger
// ============================================================================
// Structured JSON logging for production, colorized console output for
// development. Logs are written to files in production for persistent
// access and to stdout/stderr in development for immediate visibility.
//
// Usage:
//   import logger from '@/utils/logger';
//   logger.info('Server started', { port: 5000 });
//   logger.error('Database connection failed', { error: err.message });
//   logger.warn('Rate limit approaching', { ip: req.ip, count: 95 });
//   logger.debug('Query executed', { query, duration: '42ms' });
// ============================================================================

import winston from 'winston';
import path from 'path';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Log format definitions
// ---------------------------------------------------------------------------

/**
 * Production format: structured JSON with timestamp, level, message, and metadata.
 * Optimized for log aggregation tools (e.g., CloudWatch, Datadog, ELK).
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Development format: colorized, human-readable console output.
 * Includes timestamp, level with color, and pretty-printed metadata.
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0
      ? `\n  ${JSON.stringify(meta, null, 2)}`
      : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}${stackStr}`;
  })
);

// ---------------------------------------------------------------------------
// Transport definitions
// ---------------------------------------------------------------------------

const transports: winston.transport[] = [];

if (env.IS_PRODUCTION) {
  // Production: JSON logs to files
  transports.push(
    // Error logs → separate file for quick access
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    }),
    // All logs → combined file
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 10,
      tailable: true,
    })
  );
} else {
  // Development: colorized console output
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
}

// ---------------------------------------------------------------------------
// Create logger instance
// ---------------------------------------------------------------------------

const logger = winston.createLogger({
  level: env.IS_PRODUCTION ? 'info' : 'debug',
  format: env.IS_PRODUCTION ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'electrokart-api',
  },
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// ---------------------------------------------------------------------------
// Stream for Morgan HTTP request logging
// ---------------------------------------------------------------------------

/**
 * Write stream adapter for Morgan middleware.
 * Pipes HTTP request logs through Winston at the 'http' level.
 *
 * Usage in app.ts:
 *   app.use(morgan('combined', { stream: logger.stream }));
 */
const stream = {
  write: (message: string): void => {
    // Remove trailing newline from Morgan output
    logger.info(message.trim(), { type: 'http' });
  },
};

// Attach stream to logger for easy access
(logger as any).stream = stream;

export default logger;
export { stream as morganStream };
