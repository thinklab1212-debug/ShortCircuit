// ============================================================================
// ElectroKart — Review Service
// ============================================================================
// Manages review CRUD, verifies user purchase status (for verified buyer flag),
// and triggers product ratings aggregations.
// ============================================================================

import Review from '../models/Review.model.js';
import Product from '../models/Product.model.js';
import Order from '../models/Order.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export class ReviewService {
  /**
   * Retrieves paginated reviews for a specific product.
   */
  public static async getProductReviews(productId: string, queryParams: any) {
    const filter = { product: productId };
    return executePaginatedQuery(Review, filter, {
      ...queryParams,
      populate: [{ path: 'user', select: 'firstName lastName avatar' }],
    });
  }

  /**
   * Creates a review for a product. Verifies order history for purchase tag.
   */
  public static async createReview(
    userId: string,
    productId: string,
    dto: any
  ): Promise<InstanceType<typeof Review>> {
    // 1. Verify product exists
    const productExists = await Product.exists({ _id: productId, isActive: true });
    if (!productExists) {
      throw ApiError.notFound('Product not found or inactive.');
    }

    // 2. Prevent duplicate reviews (enforced by DB unique index, checked here for clean message)
    const duplicateExists = await Review.exists({ user: userId, product: productId });
    if (duplicateExists) {
      throw ApiError.conflict('You have already submitted a review for this product.');
    }

    // 3. Check order history for verified purchase tag
    // User has a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'delivered',
    }).select('_id');

    const isVerifiedPurchase = !!deliveredOrder;

    // 4. Create review
    const review = await Review.create({
      user: userId,
      product: productId,
      order: deliveredOrder?._id || undefined,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      isVerifiedPurchase,
    });

    // Recalculate average rating (handled by Mongoose post-save hook on Review model)
    // But we trigger it explicitly just in case hooks are bypassed
    Product.recalculateRatings(review.product);

    return review;
  }

  /**
   * Modifies an existing review (only the author can edit).
   */
  public static async updateReview(
    userId: string,
    reviewId: string,
    dto: any
  ): Promise<InstanceType<typeof Review>> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review not found.');
    }

    // Check ownership
    if (review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You can only update your own reviews.');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.comment !== undefined) review.comment = dto.comment;

    await review.save();

    // Trigger ratings update
    Product.recalculateRatings(review.product);

    return review;
  }

  /**
   * Deletes a review (author or admin).
   */
  public static async deleteReview(userId: string, userRole: string, reviewId: string): Promise<void> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review not found.');
    }

    // Check ownership or admin status
    if (userRole !== 'admin' && review.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to delete this review.');
    }

    await Review.deleteOne({ _id: reviewId });

    // Trigger ratings update
    Product.recalculateRatings(review.product);
  }
}

export default ReviewService;
