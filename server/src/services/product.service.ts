// ============================================================================
// ElectroKart — Product Service
// ============================================================================
// Handles product catalogue curation, catalog queries, search/filters resolution,
// related product matches, and inventory stock updates.
// ============================================================================

import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import { buildProductFilters, buildAdminProductFilters } from '../utils/filterBuilder.js';

export class ProductService {
  /**
   * Resolves category and brand slugs in filter objects into DB ObjectIds.
   */
  private static async resolveSlugs(filter: Record<string, any>): Promise<Record<string, any>> {
    const resolved = { ...filter };
    
    if (resolved._categorySlug) {
      const category = await Category.findOne({ slug: resolved._categorySlug, isActive: true }).select('_id');
      if (category) {
        resolved.category = category._id;
      } else {
        // If slug is unmapped, force empty results by querying a non-existent ID
        resolved.category = new mongoose.Types.ObjectId();
      }
      delete resolved._categorySlug;
    }

    if (resolved._brandSlug) {
      const brand = await Brand.findOne({ slug: resolved._brandSlug, isActive: true }).select('_id');
      if (brand) {
        resolved.brand = brand._id;
      } else {
        resolved.brand = new mongoose.Types.ObjectId();
      }
      delete resolved._brandSlug;
    }

    return resolved;
  }

  /**
   * Retrieves products with filters, sorting, and pagination (Public).
   */
  public static async getProducts(queryParams: any) {
    const { filter, sort } = buildProductFilters(queryParams);
    const resolvedFilter = await this.resolveSlugs(filter);

    return executePaginatedQuery(Product, resolvedFilter, {
      ...queryParams,
      sort,
      populate: [
        { path: 'category', select: 'name slug icon' },
        { path: 'brand', select: 'name slug logo' },
      ],
    });
  }

  /**
   * Retrieves products for administrators (includes inactive items).
   */
  public static async getAdminProducts(queryParams: any) {
    const { filter, sort } = buildAdminProductFilters(queryParams);
    const resolvedFilter = await this.resolveSlugs(filter);

    return executePaginatedQuery(Product, resolvedFilter, {
      ...queryParams,
      sort,
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug' },
      ],
    });
  }

  /**
   * Creates a new catalog product (Admin only).
   */
  public static async createProduct(dto: any): Promise<InstanceType<typeof Product>> {
    // Check for SKU collisions
    const existingProduct = await Product.findOne({ sku: dto.sku.toUpperCase() });
    if (existingProduct) {
      throw ApiError.conflict(`Product with SKU "${dto.sku}" already exists.`);
    }

    // Verify category and brand exist and are active
    const [categoryExists, brandExists] = await Promise.all([
      Category.exists({ _id: dto.category, isActive: true }),
      Brand.exists({ _id: dto.brand, isActive: true }),
    ]);

    if (!categoryExists) throw ApiError.badRequest('Invalid or inactive category ID.');
    if (!brandExists) throw ApiError.badRequest('Invalid or inactive brand ID.');

    // Admin-created products are immediately approved and visible
    const product = await Product.create({
      ...dto,
      approvalStatus: 'approved',  // Admin products skip review
    });

    // Trigger denormalized counts (async, non-blocking)
    Category.updateProductCount(dto.category);

    return product;
  }

  /**
   * Updates an existing catalog product (Admin only).
   */
  public static async updateProduct(productId: string, dto: any): Promise<InstanceType<typeof Product>> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    // Check SKU collision if SKU is changing
    if (dto.sku && dto.sku.toUpperCase() !== product.sku) {
      const skuCollision = await Product.exists({ sku: dto.sku.toUpperCase() });
      if (skuCollision) {
        throw ApiError.conflict(`SKU "${dto.sku}" is already assigned to another product.`);
      }
    }

    // Check Category and Brand updates
    const oldCategoryId = product.category;
    if (dto.category && dto.category.toString() !== product.category.toString()) {
      const categoryExists = await Category.exists({ _id: dto.category, isActive: true });
      if (!categoryExists) throw ApiError.badRequest('Invalid or inactive category ID.');
    }
    if (dto.brand && dto.brand.toString() !== product.brand.toString()) {
      const brandExists = await Brand.exists({ _id: dto.brand, isActive: true });
      if (!brandExists) throw ApiError.badRequest('Invalid or inactive brand ID.');
    }

    // Perform updates
    Object.assign(product, dto);
    await product.save();

    // Recalculate category denormalized counts if changing category
    if (dto.category && dto.category.toString() !== oldCategoryId.toString()) {
      Category.updateProductCount(oldCategoryId);
      Category.updateProductCount(dto.category);
    }

    return product;
  }

  /**
   * Soft deletes or disables a product (Admin only).
   */
  public static async deleteProduct(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    product.isActive = false;
    await product.save();

    // Update category denormalized count
    Category.updateProductCount(product.category);
  }

  /**
   * Retrieves a product by its unique URL slug.
   */
  public static async getProductBySlug(slug: string): Promise<InstanceType<typeof Product>> {
    // SAFETY: Both isActive AND approvalStatus are required for public access
    const product = await Product.findOne({ slug, isActive: true, approvalStatus: 'approved' })
      .populate({ path: 'category', select: 'name slug icon' })
      .populate({ path: 'brand', select: 'name slug logo' });

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    return product;
  }

  /**
   * Retrieves a product by its unique database ID (for admin/operational lookups).
   */
  public static async getProductById(productId: string): Promise<InstanceType<typeof Product>> {
    const product = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    return product;
  }

  /**
   * Retrieves related products (same category, excluding the product itself).
   */
  public static async getRelatedProducts(productId: string, limit: number = 4): Promise<InstanceType<typeof Product>[]> {
    const product = await Product.findById(productId).select('category');
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    return Product.find({
      category: product.category,
      _id: { $ne: productId },
      isActive: true,
      approvalStatus: 'approved',    // SAFETY: only show approved products
    })
      .limit(limit)
      .populate('category', 'name slug')
      .populate('brand', 'name slug');
  }

  /**
   * Retrieves list of featured products.
   */
  public static async getFeaturedProducts(limit: number = 8): Promise<InstanceType<typeof Product>[]> {
    return Product.find({ isFeatured: true, isActive: true, approvalStatus: 'approved' })
      .limit(limit)
      .populate('category', 'name slug')
      .populate('brand', 'name slug');
  }

  /**
   * Generates search/autocomplete queries suggestions.
   */
  public static async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || !query.trim()) return [];

    const products = await Product.find(
      { $text: { $search: query }, isActive: true, approvalStatus: 'approved' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('name')
      .lean();

    return products.map((p) => p.name);
  }

  /**
   * Atomically decreases inventory stock when orders are placed (part of order transaction).
   */
  public static async checkAndDecreaseStock(
    productId: string,
    variantName?: string,
    variantValue?: string,
    quantity: number = 1,
    session?: mongoose.ClientSession
  ): Promise<void> {
    const product = await Product.findById(productId).session(session || null);
    if (!product || !product.isActive) {
      throw new ApiError(400, `Product ${productId} is no longer available.`);
    }

    // 1. If checking variant stock
    if (variantName && variantValue) {
      const variant = product.variants.find((v) => v.name === variantName);
      if (!variant) {
        throw new ApiError(400, `Variant ${variantName} not found for product ${product.name}`);
      }

      const option = variant.options.find((o) => o.value === variantValue);
      if (!option) {
        throw new ApiError(400, `Option ${variantValue} not found under variant ${variantName}`);
      }

      if (option.stock < quantity) {
        throw new ApiError(400, `Insufficient stock for product ${product.name} (Variant: ${variantValue}). Available: ${option.stock}`);
      }

      // Decrease variant option stock
      option.stock -= quantity;
      
      // Also decrease base stock
      if (product.stock < quantity) {
        throw new ApiError(400, `Insufficient stock for product ${product.name}. Available: ${product.stock}`);
      }
      product.stock -= quantity;
    }
    // 2. Base stock check
    else {
      if (product.stock < quantity) {
        throw new ApiError(400, `Insufficient stock for product ${product.name}. Available: ${product.stock}`);
      }
      product.stock -= quantity;
    }

    product.soldCount += quantity;
    await product.save({ session });
  }

  /**
   * Increases inventory stock (used on order cancellations or returns).
   */
  public static async increaseStock(
    productId: string,
    variantName?: string,
    variantValue?: string,
    quantity: number = 1,
    session?: mongoose.ClientSession
  ): Promise<void> {
    const product = await Product.findById(productId).session(session || null);
    if (!product) return;

    if (variantName && variantValue) {
      const variant = product.variants.find((v) => v.name === variantName);
      if (variant) {
        const option = variant.options.find((o) => o.value === variantValue);
        if (option) {
          option.stock += quantity;
        }
      }
    }

    product.stock += quantity;
    // Prevent soldCount from falling below zero
    product.soldCount = Math.max(0, product.soldCount - quantity);
    
    await product.save({ session });
  }
}

export default ProductService;
