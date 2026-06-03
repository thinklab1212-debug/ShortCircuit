// ============================================================================
// ElectroKart — 404 Not Found Middleware
// ============================================================================
// Catches any requests that don't match any registered route handlers,
// generating a standard ApiError(404) to propagate to the global error handler.
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/index.js';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApiError(
    404,
    `Cannot find requested route: ${req.method} ${req.originalUrl}`
  );
  next(error);
}

export default notFoundHandler;
