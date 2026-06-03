// ============================================================================
// ElectroKart — Centralized Error Handler Middleware
// ============================================================================
// Catches and formats all operational and programmer errors across routes.
// Sanitizes error messages for production and exposes full stack traces in development.
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ApiError, logger } from '../utils/index.js';

/**
 * Express error-handling middleware.
 * Express detects error-handlers by their four-argument signature (err, req, res, next).
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  let error = err;

  // 1. If it's not already an instance of ApiError, classify it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.status ? Number(error.status) : 500);
    const message = error.message || 'Internal Server Error';
    
    error = new ApiError(statusCode, message, [], err.stack);
    
    // Defer operational status to specific structural errors
    error.isOperational = false; 

    // 2. Classify Mongoose CastError (e.g. invalid MongoDB ObjectId query)
    if (err.name === 'CastError') {
      const msg = `Invalid format for resource parameter: ${err.path} ("${err.value}")`;
      error = new ApiError(400, msg);
    }
    
    // 3. Classify Mongoose validation error
    else if (err.name === 'ValidationError') {
      error = ApiError.fromMongooseValidation(err);
    }

    // Classify Multer errors (file uploads size/count constraints)
    else if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        error = new ApiError(400, 'File size too large. Maximum limit is 5MB.');
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        error = new ApiError(400, 'Too many files uploaded in a single request.');
      } else {
        error = new ApiError(400, `Upload error: ${err.message}`);
      }
    }
    
    // 4. Classify MongoDB Duplicate Key Error (Code 11000)
    else if (err.code === 11000) {
      error = ApiError.fromMongoDuplicateKey(err);
    }
    
    // 5. Classify JSON Parsing issues
    else if (err instanceof SyntaxError && 'body' in err) {
      error = new ApiError(400, 'Invalid JSON body format');
    }

    // 6. Classify JWT Errors
    else if (err.name === 'JsonWebTokenError') {
      error = new ApiError(401, 'Invalid authentication token');
    }
    else if (err.name === 'TokenExpiredError') {
      error = new ApiError(401, 'Authentication token has expired');
    }
  }

  // Log error using Winston logger
  const requestId = req.headers['x-request-id'] || 'unknown-req';
  
  if (error.statusCode >= 500) {
    logger.error({
      message: `[500 ERROR] - ${req.method} ${req.url} - RequestID: ${requestId} - Error: ${error.message}`,
      stack: error.stack,
      meta: {
        method: req.method,
        url: req.url,
        requestId,
      },
    });
  } else {
    logger.warn({
      message: `[API WARN] [${error.statusCode}] - ${req.method} ${req.url} - RequestID: ${requestId} - Message: ${error.message}`,
      meta: {
        statusCode: error.statusCode,
        method: req.method,
        url: req.url,
        requestId,
        errors: error.errors,
      },
    });
  }

  // 3. Construct response structure
  const statusCode = error.statusCode || 500;
  
  // For production, suppress internal server details
  const message = (statusCode >= 500 && !env.IS_DEVELOPMENT)
    ? 'An unexpected error occurred on the server'
    : error.message;

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    timestamp: new Date().toISOString(),
    // Include stack trace only in development/staging environments
    stack: !env.IS_PRODUCTION ? error.stack : undefined,
  });
}

export default globalErrorHandler;
