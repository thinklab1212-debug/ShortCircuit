// ============================================================================
// ElectroKart — Async Handler Wrapper
// ============================================================================
// Wraps async Express route handlers to catch errors automatically and
// pass them to the global error handler via next(). Eliminates the need
// for try-catch blocks in every controller method.
//
// Usage:
//   router.get('/products', asyncHandler(async (req, res) => {
//     const products = await productService.getAll();
//     res.json(new ApiResponse(200, products));
//   }));
//
// Any thrown error (including ApiError) is caught and forwarded to
// the globalErrorHandler middleware.
// ============================================================================

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async Express route handler to automatically catch errors.
 *
 * @param fn - Async route handler function
 * @returns Express RequestHandler that catches promise rejections
 */
const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
