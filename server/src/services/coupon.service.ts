// ============================================================================
// ElectroKart — Coupon Service
// ============================================================================
// Manages coupon codes creation, validation checks, and discount calculations.
// ============================================================================

import Coupon from '../models/Coupon.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export class CouponService {
  /**
   * Retrieves all coupons (Admin, paginated).
   */
  public static async getAllCoupons(queryParams: any) {
    return executePaginatedQuery(Coupon, {}, queryParams);
  }

  /**
   * Creates a new coupon (Admin only).
   */
  public static async createCoupon(dto: any): Promise<InstanceType<typeof Coupon>> {
    const code = dto.code.toUpperCase();
    
    // Check code collision
    const existing = await Coupon.findOne({ code });
    if (existing) {
      throw ApiError.conflict(`Coupon code "${code}" already exists.`);
    }

    const coupon = await Coupon.create({
      code,
      description: dto.description,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount,
      maxDiscount: dto.maxDiscount,
      validFrom: dto.validFrom,
      validUntil: dto.validUntil,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
      applicableCategories: dto.applicableCategories,
      isActive: dto.isActive,
    });

    return coupon;
  }

  /**
   * Modifies an existing coupon (Admin only).
   */
  public static async updateCoupon(couponId: string, dto: any): Promise<InstanceType<typeof Coupon>> {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found.');
    }

    if (dto.code && dto.code.toUpperCase() !== coupon.code) {
      const codeCollision = await Coupon.exists({ code: dto.code.toUpperCase(), _id: { $ne: couponId } });
      if (codeCollision) {
        throw ApiError.conflict(`Coupon code "${dto.code.toUpperCase()}" already exists.`);
      }
    }

    Object.assign(coupon, dto);
    await coupon.save();

    return coupon;
  }

  /**
   * Deletes a coupon (Admin only).
   */
  public static async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found.');
    }

    await Coupon.deleteOne({ _id: couponId });
  }

  /**
   * Validates a coupon code against a specific shopping cart total.
   */
  public static async validateCoupon(
    code: string,
    userId: string,
    cartTotal: number,
    cartCategoryIds: string[]
  ): Promise<{
    coupon: InstanceType<typeof Coupon>;
    discountAmount: number;
  }> {
    const uppercaseCode = code.toUpperCase();
    const coupon = await Coupon.findOne({ code: uppercaseCode, isActive: true });

    if (!coupon) {
      throw ApiError.notFound('Coupon code is invalid or has expired.');
    }

    // 1. Verify general validity (expiration date and usage limit)
    const isValid = await coupon.isValid();
    if (!isValid) {
      throw new ApiError(400, 'Coupon is expired or usage limits have been reached.');
    }

    // 2. Verify user-specific usage limit
    const hasExceeded = await coupon.hasUserExceededLimit(userId as any);
    if (hasExceeded) {
      throw new ApiError(400, 'You have already reached the maximum usage limit for this coupon.');
    }

    // 3. Verify minimum order amount threshold
    if (cartTotal < (coupon.minOrderAmount || 0)) {
      throw new ApiError(400, `Minimum order value of ₹${coupon.minOrderAmount} is required to apply this coupon.`);
    }

    // 4. Verify category scope if applicable
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const applicableCategories = coupon.applicableCategories;
      const matchesCategory = cartCategoryIds.some((catId: any) =>
        applicableCategories.map((c) => c.toString()).includes(catId.toString())
      );
      if (!matchesCategory) {
        throw new ApiError(400, 'This coupon is not applicable to any products in your cart.');
      }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cartTotal);

    return {
      coupon,
      discountAmount,
    };
  }
}

export default CouponService;
