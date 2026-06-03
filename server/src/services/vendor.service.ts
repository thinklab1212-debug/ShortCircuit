// ============================================================================
// ElectroKart — Vendor Service
// ============================================================================
// Business logic for vendor operations: profile management, vendor product
// CRUD with approval workflow, admin vendor account creation, and review queue.
// ============================================================================

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import VendorProfile from '../models/VendorProfile.model.js';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export class VendorService {
  // =========================================================================
  // Admin: Create Vendor Account
  // =========================================================================

  /**
   * Creates a User (role=vendor) + VendorProfile in one step.
   */
  public static async createVendor(dto: any): Promise<{
    user: InstanceType<typeof User>;
    profile: InstanceType<typeof VendorProfile>;
  }> {
    // Check email uniqueness
    const existingUser = await User.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('A user with this email already exists.');
    }

    // Check business name uniqueness
    const existingProfile = await VendorProfile.findOne({ businessName: dto.businessName });
    if (existingProfile) {
      throw ApiError.conflict('A vendor with this business name already exists.');
    }

    // Create user with vendor role
    const user = await User.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      password: dto.password,
      role: 'vendor',
    });

    // Create vendor profile
    const profile = await VendorProfile.create({
      user: user._id,
      businessName: dto.businessName,
      contactPerson: dto.contactPerson,
      phone: dto.phone,
      gstin: dto.gstin,
    });

    return { user, profile };
  }

  // =========================================================================
  // Admin: Vendor Management
  // =========================================================================

  /**
   * Lists all vendor profiles (paginated).
   */
  public static async getVendors(queryParams: any) {
    return executePaginatedQuery(VendorProfile, {}, {
      ...queryParams,
      populate: [{ path: 'user', select: 'firstName lastName email isBlocked' }],
    });
  }

  /**
   * Retrieves a single vendor profile by its ID.
   */
  public static async getVendorById(vendorId: string): Promise<InstanceType<typeof VendorProfile>> {
    const profile = await VendorProfile.findById(vendorId)
      .populate('user', 'firstName lastName email isBlocked createdAt');

    if (!profile) {
      throw ApiError.notFound('Vendor profile not found.');
    }

    return profile;
  }

  // =========================================================================
  // Admin: Product Review Queue
  // =========================================================================

  /**
   * Lists products awaiting admin review.
   */
  public static async getReviewQueue(queryParams: any) {
    return executePaginatedQuery(
      Product,
      { approvalStatus: 'pending_review', vendor: { $ne: null } },
      {
        ...queryParams,
        sort: '-submittedAt',
        populate: [
          { path: 'vendor', select: 'firstName lastName email' },
          { path: 'category', select: 'name slug' },
          { path: 'brand', select: 'name slug' },
        ],
        select: '+vendorPrice',
      }
    );
  }

  /**
   * Admin approves or rejects a vendor product.
   */
  public static async reviewProduct(
    productId: string,
    adminUserId: string,
    dto: any
  ): Promise<InstanceType<typeof Product>> {
    const product = await Product.findById(productId).select('+vendorPrice');
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (!product.vendor) {
      throw new ApiError(400, 'This is a platform product and does not require vendor review.');
    }

    if (dto.action === 'approve') {
      // ATOMIC: All approval fields set together
      product.approvalStatus = 'approved';
      product.isActive = true;
      product.price = dto.price;
      if (dto.salePrice !== undefined) {
        product.salePrice = dto.salePrice;
      }
      product.rejectionReason = undefined;
      product.reviewedAt = new Date();
      product.reviewedBy = adminUserId as any;
    } else if (dto.action === 'reject') {
      // ATOMIC: All rejection fields set together
      product.approvalStatus = 'rejected';
      product.isActive = false;
      product.rejectionReason = dto.reason;
      product.reviewedAt = new Date();
      product.reviewedBy = adminUserId as any;
    }

    await product.save();
    return product;
  }

  // =========================================================================
  // Vendor: Profile
  // =========================================================================

  /**
   * Retrieves the vendor's own profile.
   */
  public static async getProfile(userId: string): Promise<InstanceType<typeof VendorProfile>> {
    const profile = await VendorProfile.findOne({ user: userId });
    if (!profile) {
      throw ApiError.notFound('Vendor profile not found.');
    }
    return profile;
  }

  /**
   * Updates the vendor's own profile.
   */
  public static async updateProfile(
    userId: string,
    dto: any
  ): Promise<InstanceType<typeof VendorProfile>> {
    const profile = await VendorProfile.findOne({ user: userId });
    if (!profile) {
      throw ApiError.notFound('Vendor profile not found.');
    }

    // Check business name uniqueness if changing
    if (dto.businessName && dto.businessName !== profile.businessName) {
      const existing = await VendorProfile.findOne({ businessName: dto.businessName });
      if (existing) {
        throw ApiError.conflict('A vendor with this business name already exists.');
      }
    }

    Object.assign(profile, dto);
    await profile.save();
    return profile;
  }

  // =========================================================================
  // Vendor: Dashboard Stats
  // =========================================================================

  /**
   * Returns product counts by approval status for the vendor dashboard.
   */
  public static async getDashboard(userId: string): Promise<{
    total: number;
    draft: number;
    pendingReview: number;
    approved: number;
    rejected: number;
  }> {
    const [total, draft, pendingReview, approved, rejected] = await Promise.all([
      Product.countDocuments({ vendor: userId }),
      Product.countDocuments({ vendor: userId, approvalStatus: 'draft' }),
      Product.countDocuments({ vendor: userId, approvalStatus: 'pending_review' }),
      Product.countDocuments({ vendor: userId, approvalStatus: 'approved' }),
      Product.countDocuments({ vendor: userId, approvalStatus: 'rejected' }),
    ]);

    return { total, draft, pendingReview, approved, rejected };
  }

  // =========================================================================
  // Vendor: Product CRUD
  // =========================================================================

  /**
   * Lists the vendor's own products (filterable by approvalStatus).
   */
  public static async getVendorProducts(userId: string, queryParams: any) {
    const filter: Record<string, any> = { vendor: userId };

    if (queryParams.approvalStatus) {
      filter.approvalStatus = queryParams.approvalStatus;
    }

    return executePaginatedQuery(Product, filter, {
      ...queryParams,
      sort: queryParams.sort || '-createdAt',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug' },
      ],
      select: '+vendorPrice',
    });
  }

  /**
   * Retrieves a single vendor product (with ownership check).
   */
  public static async getVendorProduct(
    userId: string,
    productId: string
  ): Promise<InstanceType<typeof Product>> {
    const product = await Product.findById(productId)
      .select('+vendorPrice')
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (!product.vendor || product.vendor.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to access this product.');
    }

    return product;
  }

  /**
   * Creates a new product for the vendor (status: draft, isActive: false).
   */
  public static async createProduct(
    userId: string,
    dto: any
  ): Promise<InstanceType<typeof Product>> {
    // Check SKU uniqueness
    const existingSku = await Product.findOne({ sku: dto.sku.toUpperCase() });
    if (existingSku) {
      throw ApiError.conflict(`Product with SKU "${dto.sku}" already exists.`);
    }

    // Verify category and brand exist
    const [categoryExists, brandExists] = await Promise.all([
      Category.exists({ _id: dto.category, isActive: true }),
      Brand.exists({ _id: dto.brand, isActive: true }),
    ]);

    if (!categoryExists) throw ApiError.badRequest('Invalid or inactive category.');
    if (!brandExists) throw ApiError.badRequest('Invalid or inactive brand.');

    const product = await Product.create({
      ...dto,
      vendor: userId,
      approvalStatus: 'draft',
      isActive: false,
      // Vendor cannot set these
      price: 0,
      isFeatured: false,
    });

    return product;
  }

  /**
   * Updates a vendor's own product. If approved → pending_review + isActive: false.
   */
  public static async updateProduct(
    userId: string,
    productId: string,
    dto: any
  ): Promise<InstanceType<typeof Product>> {
    const product = await Product.findById(productId).select('+vendorPrice');
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (!product.vendor || product.vendor.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to edit this product.');
    }

    if (product.approvalStatus === 'pending_review') {
      throw new ApiError(400, 'Cannot edit a product that is currently under review.');
    }

    // Check SKU collision if changing
    if (dto.sku && dto.sku.toUpperCase() !== product.sku) {
      const skuCollision = await Product.exists({ sku: dto.sku.toUpperCase() });
      if (skuCollision) {
        throw ApiError.conflict(`SKU "${dto.sku}" is already assigned to another product.`);
      }
    }

    // Vendor cannot set admin-only fields
    delete dto.price;
    delete dto.salePrice;
    delete dto.costPrice;
    delete dto.isFeatured;
    delete dto.isActive;
    delete dto.approvalStatus;

    // Any edit on an approved product reverts to draft.
    // Vendor must explicitly re-submit via the submit action.
    const wasApproved = product.approvalStatus === 'approved';

    Object.assign(product, dto);

    if (wasApproved) {
      product.approvalStatus = 'draft';
      product.isActive = false;
    }

    await product.save();
    return product;
  }

  /**
   * Soft-deletes a vendor's own product.
   */
  public static async deleteProduct(userId: string, productId: string): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (!product.vendor || product.vendor.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this product.');
    }

    product.isActive = false;
    await product.save();
  }

  /**
   * Submits a draft/rejected product for admin review.
   */
  public static async submitForReview(
    userId: string,
    productId: string
  ): Promise<InstanceType<typeof Product>> {
    const product = await Product.findById(productId).select('+vendorPrice');
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (!product.vendor || product.vendor.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to submit this product.');
    }

    const submittableStatuses = ['draft', 'rejected'];
    if (!submittableStatuses.includes(product.approvalStatus)) {
      throw new ApiError(400, `Cannot submit product with status "${product.approvalStatus}".`);
    }

    product.approvalStatus = 'pending_review';
    product.submittedAt = new Date();
    product.rejectionReason = undefined;
    await product.save();

    return product;
  }
}

export default VendorService;
