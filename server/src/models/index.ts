// ============================================================================
// ElectroKart — Model Index (Barrel Export)
// ============================================================================
// Central export point for all Mongoose models.
// Import from '@models' or '@/models' in the application.
// ============================================================================

export { default as User, type IUser, type IUserModel } from './User.model.js';
export { default as Token, type IToken, type ITokenModel } from './Token.model.js';
export { default as Category, type ICategory, type ICategoryModel } from './Category.model.js';
export { default as Brand, type IBrand } from './Brand.model.js';
export { default as Product, type IProduct, type IProductModel } from './Product.model.js';
export { default as Review, type IReview } from './Review.model.js';
export { default as Cart, type ICart, type ICartItem } from './Cart.model.js';
export { default as Wishlist, type IWishlist } from './Wishlist.model.js';
export { default as Address, type IAddress } from './Address.model.js';
export { default as Order, type IOrder, type IOrderModel } from './Order.model.js';
export { default as Coupon, type ICoupon } from './Coupon.model.js';
export { default as Banner, type IBanner } from './Banner.model.js';
export { default as VendorProfile, type IVendorProfile } from './VendorProfile.model.js';
