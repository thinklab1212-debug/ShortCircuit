// ============================================================================
// ElectroKart — Security Middleware
// ============================================================================
// Contains security components:
//  1. Request ID Generation — Traces requests across services.
//  2. NoSQL Mongo Injection Sanitization — Prevents query manipulation.
//  3. Custom XSS Protection — Recursively scrubs inputs of HTML execution tags.
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoSanitize from 'express-mongo-sanitize';

// ---------------------------------------------------------------------------
// 1. Request ID Middleware
// ---------------------------------------------------------------------------

/**
 * Assigns a unique UUID to each request header and response header
 * to track logging flow across backend operations.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}

// ---------------------------------------------------------------------------
// 2. Mongo Sanitization Middleware
// ---------------------------------------------------------------------------

/**
 * Standard NoSQL injection sanitizer.
 * Automatically strips keys beginning with '$' or containing '.' from body, query, and params.
 */
export const mongoSanitizer = mongoSanitize({
  replaceWith: '_', // Replace malicious operators rather than deleting keys
});

// ---------------------------------------------------------------------------
// 3. Custom XSS Protection Middleware
// ---------------------------------------------------------------------------

/**
 * Recursive sanitizer helper to scrub string values of HTML characters.
 */
function cleanXss(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  if (Array.isArray(value)) {
    return value.map(cleanXss);
  }
  
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      cleaned[key] = cleanXss(val);
    }
    return cleaned;
  }
  
  return value;
}

/**
 * Custom XSS Sanitizer middleware.
 * Recursively cleans query parameters, URL path parameters, and payload body.
 */
export function xssSanitizer(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = cleanXss(req.body);
  }
  if (req.query) {
    req.query = cleanXss(req.query);
  }
  if (req.params) {
    req.params = cleanXss(req.params);
  }
  next();
}

export default {
  requestId,
  mongoSanitizer,
  xssSanitizer,
};
