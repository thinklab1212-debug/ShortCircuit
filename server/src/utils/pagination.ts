// ============================================================================
// ElectroKart — Pagination Helper
// ============================================================================
// Provides a reusable pagination utility for Mongoose queries. Handles
// page/limit parsing, skip calculation, and generates pagination metadata
// for the API response.
//
// Usage:
//   const { skip, limit, page } = parsePaginationParams(req.query);
//   const [docs, total] = await Promise.all([
//     Model.find(query).skip(skip).limit(limit),
//     Model.countDocuments(query),
//   ]);
//   const pagination = buildPaginationMeta(page, limit, total);
// ============================================================================

import type { PaginationMeta } from './ApiResponse.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;         // Hard cap to prevent abuse
const MIN_LIMIT = 1;

// ---------------------------------------------------------------------------
// Parsed pagination parameters
// ---------------------------------------------------------------------------

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

// ---------------------------------------------------------------------------
// Parse pagination from query parameters
// ---------------------------------------------------------------------------

/**
 * Extracts and validates page/limit from Express query params.
 * Applies defaults and enforces hard limits.
 *
 * @param query - Express req.query object
 * @returns Sanitized page, limit, and calculated skip value
 *
 * @example
 *   // GET /products?page=2&limit=10
 *   parsePaginationParams(req.query)
 *   // → { page: 2, limit: 10, skip: 10 }
 */
export function parsePaginationParams(query: Record<string, any>): ParsedPagination {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Validate and apply defaults
  if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
  if (isNaN(limit) || limit < MIN_LIMIT) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// ---------------------------------------------------------------------------
// Build pagination metadata for API response
// ---------------------------------------------------------------------------

/**
 * Builds the pagination metadata object included in API responses.
 *
 * @param page         - Current page number
 * @param limit        - Items per page
 * @param totalResults - Total number of matching documents
 * @returns PaginationMeta object for ApiResponse
 *
 * @example
 *   buildPaginationMeta(2, 20, 98)
 *   // → { page: 2, limit: 20, totalPages: 5, totalResults: 98,
 *   //     hasNextPage: true, hasPrevPage: true }
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  totalResults: number
): PaginationMeta {
  const totalPages = Math.ceil(totalResults / limit);

  return {
    page,
    limit,
    totalPages,
    totalResults,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ---------------------------------------------------------------------------
// Combined pagination executor for Mongoose
// ---------------------------------------------------------------------------

/**
 * A higher-order helper that executes a paginated Mongoose query.
 * Runs the query and count in parallel for performance.
 *
 * @param model   - Mongoose model
 * @param filter  - MongoDB filter query
 * @param query   - Express req.query (contains page, limit)
 * @param options - Additional query options (sort, populate, select)
 * @returns Object containing documents and pagination metadata
 *
 * @example
 *   const result = await paginateQuery(Product, { isActive: true }, req.query, {
 *     sort: '-createdAt',
 *     populate: 'category brand',
 *     select: '-costPrice',
 *   });
 *   // → { docs: [...], pagination: { page: 1, limit: 20, ... } }
 */
export async function paginateQuery<T>(
  model: any,
  filter: Record<string, any>,
  query: Record<string, any>,
  options: {
    sort?: string | Record<string, 1 | -1>;
    populate?: string | object | Array<string | object>;
    select?: string;
    lean?: boolean;
  } = {}
): Promise<{ docs: T[]; pagination: PaginationMeta }> {
  const { page, limit, skip } = parsePaginationParams(query);

  // Build the query chain
  let dbQuery = model.find(filter);

  // Apply select
  if (options.select) {
    dbQuery = dbQuery.select(options.select);
  }

  // Apply sort
  if (options.sort) {
    dbQuery = dbQuery.sort(options.sort);
  } else {
    dbQuery = dbQuery.sort({ createdAt: -1 }); // Default: newest first
  }

  // Apply populate
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      for (const pop of options.populate) {
        dbQuery = dbQuery.populate(pop);
      }
    } else {
      dbQuery = dbQuery.populate(options.populate);
    }
  }

  // Apply pagination
  dbQuery = dbQuery.skip(skip).limit(limit);

  // Apply lean
  if (options.lean !== false) {
    dbQuery = dbQuery.lean();
  }

  // Execute query and count in parallel
  const [docs, totalResults] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(filter),
  ]);

  const pagination = buildPaginationMeta(page, limit, totalResults);

  return { docs: docs as T[], pagination };
}

// ---------------------------------------------------------------------------
// Convenience wrapper used across services
// ---------------------------------------------------------------------------

/**
 * Executes a paginated query where a single params object carries both the
 * pagination inputs (page/limit) and the query options (sort/populate/select).
 * This is the shape every service call site uses.
 *
 * @example
 *   executePaginatedQuery(Product, filter, { page, limit, sort, populate: [...] })
 */
export async function executePaginatedQuery<T>(
  model: any,
  filter: Record<string, any>,
  params: Record<string, any> = {}
): Promise<{ docs: T[]; pagination: PaginationMeta }> {
  return paginateQuery<T>(model, filter, params, params);
}
