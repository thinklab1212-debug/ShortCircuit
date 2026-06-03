// ============================================================================
// ElectroKart — Utilities Index (Barrel Export)
// ============================================================================
// Central export point for all utility modules.
// Import from '@/utils' in the application.
// ============================================================================

export { default as ApiError } from './ApiError.js';
export { default as ApiResponse, type PaginationMeta } from './ApiResponse.js';
export { default as asyncHandler } from './asyncHandler.js';
export { default as logger, morganStream } from './logger.js';

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getRefreshTokenCookieOptions,
  decodeAccessToken,
  type AccessTokenPayload,
  type RefreshTokenPayload,
  type TokenPair,
} from './generateTokens.js';

export {
  parsePaginationParams,
  buildPaginationMeta,
  paginateQuery,
  type ParsedPagination,
} from './pagination.js';

export {
  buildProductFilters,
  buildAdminProductFilters,
  buildOrderFilters,
  isValidObjectId,
  type ProductQueryParams,
  type OrderQueryParams,
  type BuiltFilters,
} from './filterBuilder.js';
