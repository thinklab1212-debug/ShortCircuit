// ============================================================================
// ElectroKart — Wishlist Service
// ============================================================================
// Handles user wishlist CRUD operations.
// ============================================================================

import Wishlist from '../models/Wishlist.model.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/index.js';

export class WishlistService {
  /**
   * Retrieves the user's wishlist (creating it if it does not exist).
   */
  public static async getWishlist(userId: string): Promise<InstanceType<typeof Wishlist>> {
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      select: 'name slug images price salePrice stock isActive sku',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    return wishlist;
  }

  /**
   * Toggles product presence in user's wishlist (adds if absent, removes if present).
   */
  public static async toggleWishlist(userId: string, productId: string): Promise<InstanceType<typeof Wishlist>> {
    // 1. Verify product exists
    const productExists = await Product.exists({ _id: productId, isActive: true });
    if (!productExists) {
      throw ApiError.notFound('Product not found or is currently inactive.');
    }

    // 2. Fetch or create wishlist
    const wishlist = await this.getWishlist(userId);

    // 3. Toggle product ID
    const productIdx = wishlist.products.findIndex((id) => id.toString() === productId.toString());

    if (productIdx > -1) {
      // Remove product
      wishlist.products.splice(productIdx, 1);
    } else {
      // Enforce max 100 products limit
      if (wishlist.products.length >= 100) {
        throw new ApiError(400, 'Wishlist limit reached. You can save at most 100 products.');
      }
      // Add product
      wishlist.products.push(productId as any);
    }

    await wishlist.save();
    return this.getWishlist(userId);
  }

  /**
   * Explicitly removes a product from the wishlist.
   */
  public static async removeFromWishlist(userId: string, productId: string): Promise<InstanceType<typeof Wishlist>> {
    const wishlist = await this.getWishlist(userId);
    
    const productIdx = wishlist.products.findIndex((id) => id.toString() === productId.toString());
    if (productIdx > -1) {
      wishlist.products.splice(productIdx, 1);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }
}

export default WishlistService;
