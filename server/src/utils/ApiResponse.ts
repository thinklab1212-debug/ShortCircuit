// ============================================================================
// ElectroKart — Standardized API Response Wrapper
// ============================================================================
// Ensures every successful API response follows a consistent structure.
// Used in controllers to wrap service return values before sending to client.
//
// Usage:
//   res.status(200).json(new ApiResponse(200, data, 'Products fetched'));
//   res.status(201).json(ApiResponse.created(product, 'Product created'));
//   res.status(200).json(ApiResponse.paginated(products, pagination, 'Products'));
// ============================================================================

interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;
  public readonly pagination?: PaginationMeta;
  public readonly timestamp: string;

  /**
   * @param statusCode - HTTP status code
   * @param data       - Response payload
   * @param message    - Human-readable success message
   * @param pagination - Optional pagination metadata
   */
  constructor(
    statusCode: number,
    data: T,
    message: string = 'Success',
    pagination?: PaginationMeta
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();

    if (pagination) {
      this.pagination = pagination;
    }
  }

  // -------------------------------------------------------------------------
  // Factory methods for common responses
  // -------------------------------------------------------------------------

  /**
   * 200 OK — Standard success response.
   */
  static ok<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return new ApiResponse(200, data, message);
  }

  /**
   * 201 Created — Resource successfully created.
   */
  static created<T>(data: T, message: string = 'Resource created successfully'): ApiResponse<T> {
    return new ApiResponse(201, data, message);
  }

  /**
   * 200 OK — Paginated list response.
   */
  static paginated<T>(
    data: T,
    pagination: PaginationMeta,
    message: string = 'Data fetched successfully'
  ): ApiResponse<T> {
    return new ApiResponse(200, data, message, pagination);
  }

  /**
   * 200 OK — No content (for delete operations).
   */
  static noContent(message: string = 'Resource deleted successfully'): ApiResponse<null> {
    return new ApiResponse(200, null, message);
  }
}

export default ApiResponse;
export type { PaginationMeta };
