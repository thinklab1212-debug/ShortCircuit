// ============================================================================
// ElectroKart — Interfaces Index (Barrel Export)
// ============================================================================
// Central export point for all type definitions and interfaces.
// Import from '@/interfaces' in the application.
//
// NOTE: express.d.ts and env.d.ts are ambient declaration files and are
// automatically picked up by TypeScript — they are NOT exported here.
// ============================================================================

// ---------------------------------------------------------------------------
// Auth interfaces
// ---------------------------------------------------------------------------
export type { UserRole } from './auth.interface.js';
export { USER_ROLES, AUTH_CONSTANTS } from './auth.interface.js';
export type {
  IAccessTokenPayload,
  IRefreshTokenPayload,
  IRegisterDTO,
  ILoginDTO,
  IForgotPasswordDTO,
  IResetPasswordDTO,
  IChangePasswordDTO,
  IAuthResponse,
  AuthenticatedRequest,
  RoleRequirement,
} from './auth.interface.js';

// ---------------------------------------------------------------------------
// Common interfaces
// ---------------------------------------------------------------------------
export type {
  IParsedPagination,
  IPaginationMeta,
  IPaginatedResult,
  IApiSuccessResponse,
  IApiErrorResponse,
  IValidationErrorDetail,
  IBaseQueryParams,
  IProductQueryParams,
  IOrderQueryParams,
  IUserQueryParams,
  SortDirection,
  SortSpec,
  ICloudinaryAsset,
  IProductImage,
  ICloudinaryUploadResult,
  IServiceResult,
  IServiceListResult,
  IBuiltFilters,
  IIdParam,
  ISlugParam,
  IProductReviewParams,
  IOrderParam,
  ICartItemParam,
  IProductImageParam,
} from './common.interface.js';

// ---------------------------------------------------------------------------
// Model DTOs (Data Transfer Objects)
// ---------------------------------------------------------------------------
export type {
  // User
  IUpdateProfileDTO,
  IUpdateAvatarDTO,
  IAdminUpdateUserDTO,

  // Category
  ICreateCategoryDTO,
  IUpdateCategoryDTO,

  // Brand
  ICreateBrandDTO,
  IUpdateBrandDTO,

  // Product
  IProductVariantOptionDTO,
  IProductVariantDTO,
  IProductSpecificationDTO,
  IProductDimensionsDTO,
  ICreateProductDTO,
  IUpdateProductDTO,

  // Review
  ICreateReviewDTO,
  IUpdateReviewDTO,

  // Cart
  IAddToCartDTO,
  IUpdateCartItemDTO,

  // Address
  ICreateAddressDTO,
  IUpdateAddressDTO,

  // Order
  IPlaceOrderDTO,
  IUpdateOrderStatusDTO,
  ICancelOrderDTO,

  // Coupon
  ICreateCouponDTO,
  IUpdateCouponDTO,
  IValidateCouponDTO,

  // Payment
  ICreateRazorpayOrderDTO,
  IVerifyPaymentDTO,

  // Banner
  ICreateBannerDTO,
  IUpdateBannerDTO,

  // Search
  ISearchSuggestion,

  // Analytics
  IDashboardStats,
  IRevenueDataPoint,
  ITopProduct,
  ITopCategory,
} from './models.interface.js';
