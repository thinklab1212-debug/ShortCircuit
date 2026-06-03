// ============================================================================
// ElectroKart — Zod Validation Middleware
// ============================================================================
// Intercepts requests, validates request body, query params, or URL path params
// against a target Zod schema, and maps ZodErrors to standardized ApiErrors.
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ApiError } from '../utils/index.js';

/**
 * Validator configurations matching parts of the Express request.
 */
interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Express middleware to validate request inputs against Zod schemas.
 * Rejects with a formatted HTTP 400 Bad Request error if validation fails.
 *
 * @param schema - Schema validations for params, query, or body
 *
 * @example
 *   router.post('/login', validate({ body: loginSchema }), loginController);
 *   router.get('/products/:id', validate({ params: objectIdSchema }), getProduct);
 */
export function validate(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate request path parameters (req.params)
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      // 2. Validate request query parameters (req.query)
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // 3. Validate request payload body (req.body)
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod fields validation details
        const validationDetails = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const apiError = new ApiError(
          400,
          'Validation failed: Invalid request inputs',
          validationDetails
        );
        return next(apiError);
      }
      
      next(error);
    }
  };
}

export default validate;
