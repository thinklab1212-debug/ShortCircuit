// ============================================================================
// ElectroKart — Custom API Error Class
// ============================================================================
// Extends the native Error class with HTTP status codes, operational error
// flags, and structured validation error details. Designed to be thrown
// anywhere in the application and caught by the global error handler.
//
// Usage:
//   throw new ApiError(404, 'Product not found');
//   throw new ApiError(400, 'Validation failed', errors);
//   throw ApiError.badRequest('Invalid email format');
//   throw ApiError.unauthorized('Token expired');
// ============================================================================

interface ValidationErrorDetail {
  field: string;
  message: string;
}

class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: ValidationErrorDetail[];

  /**
   * @param statusCode - HTTP status code (e.g., 400, 401, 404, 500)
   * @param message    - Human-readable error message
   * @param errors     - Optional array of field-level validation errors
   * @param stack      - Optional stack trace override
   */
  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: ValidationErrorDetail[] = [],
    stack?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    // Preserve proper class name in stack traces
    Object.setPrototypeOf(this, new.target.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // -------------------------------------------------------------------------
  // Factory methods for common HTTP errors
  // -------------------------------------------------------------------------

  static badRequest(message: string = 'Bad request', errors: ValidationErrorDetail[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message: string = 'Too many requests, please try again later'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    const error = new ApiError(500, message);
    error.isOperational as false; // Internal errors are not operational
    return error;
  }

  /**
   * Converts a Mongoose validation error into an ApiError with field-level details.
   */
  static fromMongooseValidation(err: any): ApiError {
    const errors: ValidationErrorDetail[] = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    return new ApiError(400, 'Validation failed', errors);
  }

  /**
   * Converts a MongoDB duplicate key error (code 11000) into an ApiError.
   */
  static fromMongoDuplicateKey(err: any): ApiError {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    return new ApiError(409, `A record with ${field} "${value}" already exists`, [
      { field, message: `${field} must be unique` },
    ]);
  }
}

export default ApiError;
