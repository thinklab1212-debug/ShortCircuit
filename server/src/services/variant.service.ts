// ============================================================================
// ElectroKart — ProductVariant Service
// ============================================================================
// Handles business logic for component variants: single creation, pre-validated
// batch imports, denormalized parent summary updates (variantCount & priceRange),
// generic parametric search, and paginated variant queries.
// ============================================================================

import mongoose from 'mongoose';
import ProductVariant, { IProductVariant } from '../models/ProductVariant.model.js';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export interface IBatchValidationResult {
  isValid: boolean;
  totalRows: number;
  validCount: number;
  errors: Array<{ index: number; sku?: string; error: string }>;
  createdVariants?: any[];
}

export class VariantService {
  /**
   * Recalculates denormalized summary fields (variantCount & priceRange) on the parent Product.
   * ProductVariant remains the ultimate source of truth.
   */
  public static async recalculateParentSummaryStats(
    productId: string | mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<void> {
    const parentId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

    const activeVariants = await ProductVariant.find({ productId: parentId, isActive: true })
      .select('price salePrice')
      .session(session || null)
      .lean();

    const variantCount = activeVariants.length;

    let priceRange = { min: 0, max: 0 };
    if (variantCount > 0) {
      const prices = activeVariants.map((v) => v.salePrice ?? v.price);
      priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    }

    await Product.findByIdAndUpdate(
      parentId,
      {
        productType: 'family',
        variantCount,
        priceRange,
      },
      { session: session || null }
    );
  }

  /**
   * Helper: Validates variant attributes against Category attributeDefinitions.
   */
  private static validateCategoryRequiredAttributes(
    attributeDefinitions: any[],
    attributes: Record<string, string> | Map<string, string>
  ): string[] {
    const errors: string[] = [];
    const attrObj = attributes instanceof Map ? Object.fromEntries(attributes) : attributes || {};

    if (Array.isArray(attributeDefinitions)) {
      for (const def of attributeDefinitions) {
        if (def.isRequired && (!attrObj[def.key] || String(attrObj[def.key]).trim() === '')) {
          errors.push(`Missing required category attribute '${def.label}' (${def.key})`);
        }
      }
    }

    return errors;
  }

  /**
   * Creates a single ProductVariant linked to a parent Product Family.
   */
  public static async createVariant(productId: string, dto: any): Promise<IProductVariant> {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Parent product family not found.');
    }

    // SKU uniqueness check
    const formattedSku = dto.sku.toUpperCase().trim();
    const skuExists = await ProductVariant.exists({ sku: formattedSku });
    if (skuExists) {
      throw ApiError.conflict(`Variant SKU "${formattedSku}" already exists.`);
    }

    // Optional category attribute validation
    if (product.category) {
      const categoryDoc = await Category.findById(product.category).select('attributeDefinitions').lean();
      if (categoryDoc && categoryDoc.attributeDefinitions) {
        const attrErrors = this.validateCategoryRequiredAttributes(categoryDoc.attributeDefinitions, dto.attributes);
        if (attrErrors.length > 0) {
          throw ApiError.badRequest(attrErrors.join('; '));
        }
      }
    }

    // Force productType to 'family' on parent product if not set
    if (product.productType !== 'family') {
      product.productType = 'family';
      await product.save();
    }

    const variant = await ProductVariant.create({
      ...dto,
      productId: product._id,
      sku: formattedSku,
    });

    // Recalculate parent summary metrics
    await this.recalculateParentSummaryStats(product._id);

    return variant;
  }

  /**
   * Executes 7-step pre-validated batch variant creation.
   * If dryRun is true, returns validation report without modifying database.
   */
  public static async batchCreateVariants(
    productId: string,
    dto: { variants: any[]; dryRun?: boolean }
  ): Promise<IBatchValidationResult> {
    const parentProduct = await Product.findById(productId);
    if (!parentProduct) {
      throw ApiError.notFound('Parent product family not found.');
    }

    const categoryDoc = parentProduct.category
      ? await Category.findById(parentProduct.category).select('attributeDefinitions').lean()
      : null;
    const categoryDefs = categoryDoc?.attributeDefinitions || [];

    const errors: Array<{ index: number; sku?: string; error: string }> = [];
    const seenSkusInBatch = new Set<string>();
    const seenCombinations = new Set<string>();

    const incomingSkus: string[] = [];
    const processedVariants: any[] = [];

    // Pre-validation Loop across incoming payload
    dto.variants.forEach((v, index) => {
      const formattedSku = String(v.sku || '').toUpperCase().trim();
      if (!formattedSku) {
        errors.push({ index, error: 'SKU is required' });
        return;
      }

      // Check batch SKU duplicate
      if (seenSkusInBatch.has(formattedSku)) {
        errors.push({ index, sku: formattedSku, error: `Duplicate SKU "${formattedSku}" in batch payload` });
        return;
      }
      seenSkusInBatch.add(formattedSku);
      incomingSkus.push(formattedSku);

      // Check attribute combination duplicate within batch
      const attrString = JSON.stringify(v.attributes || {});
      if (seenCombinations.has(attrString)) {
        errors.push({ index, sku: formattedSku, error: 'Duplicate attribute combination in batch payload' });
        return;
      }
      seenCombinations.add(attrString);

      // Category required attribute check
      const attrErrors = this.validateCategoryRequiredAttributes(categoryDefs, v.attributes);
      if (attrErrors.length > 0) {
        errors.push({ index, sku: formattedSku, error: attrErrors.join('; ') });
        return;
      }

      processedVariants.push({
        ...v,
        productId: parentProduct._id,
        sku: formattedSku,
      });
    });

    // Check DB SKU collisions
    if (incomingSkus.length > 0) {
      const existingSkusInDb = await ProductVariant.find({ sku: { $in: incomingSkus } }).select('sku').lean();
      if (existingSkusInDb.length > 0) {
        const dbSkuSet = new Set(existingSkusInDb.map((item) => item.sku));
        processedVariants.forEach((v, index) => {
          if (dbSkuSet.has(v.sku)) {
            errors.push({ index, sku: v.sku, error: `SKU "${v.sku}" already exists in database` });
          }
        });
      }
    }

    const isValid = errors.length === 0;

    // Dry Run Mode: return validation report without committing
    if (dto.dryRun || !isValid) {
      return {
        isValid,
        totalRows: dto.variants.length,
        validCount: isValid ? processedVariants.length : dto.variants.length - errors.length,
        errors,
      };
    }

    // Commit Mode: Atomic insertion & Summary update
    const createdVariants = await ProductVariant.insertMany(processedVariants);
    await this.recalculateParentSummaryStats(parentProduct._id);

    return {
      isValid: true,
      totalRows: dto.variants.length,
      validCount: createdVariants.length,
      errors: [],
      createdVariants,
    };
  }

  /**
   * Updates an existing ProductVariant and recalculates parent summary metrics if price/status changed.
   */
  public static async updateVariant(variantId: string, dto: any): Promise<IProductVariant> {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw ApiError.notFound('Product variant not found.');
    }

    // Check SKU collision if changing SKU
    if (dto.sku) {
      const formattedSku = dto.sku.toUpperCase().trim();
      if (formattedSku !== variant.sku) {
        const skuExists = await ProductVariant.exists({ sku: formattedSku });
        if (skuExists) {
          throw ApiError.conflict(`Variant SKU "${formattedSku}" already exists.`);
        }
        dto.sku = formattedSku;
      }
    }

    const priceOrStatusChanged =
      dto.price !== undefined || dto.salePrice !== undefined || dto.isActive !== undefined;

    Object.assign(variant, dto);
    await variant.save();

    if (priceOrStatusChanged) {
      await this.recalculateParentSummaryStats(variant.productId);
    }

    return variant;
  }

  /**
   * Soft-deactivates or deletes a variant and updates parent summary metrics.
   */
  public static async deleteVariant(variantId: string): Promise<void> {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw ApiError.notFound('Product variant not found.');
    }

    variant.isActive = false;
    await variant.save();

    await this.recalculateParentSummaryStats(variant.productId);
  }

  /**
   * Retrieves paginated variants linked to a parent Product Family.
   */
  public static async getVariantsByProductId(productId: string, queryParams: any) {
    const filter: Record<string, any> = { productId };

    if (queryParams.inStock === 'true' || queryParams.inStock === true) {
      filter.stock = { $gt: 0 };
    }

    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true' || queryParams.isActive === true;
    } else {
      filter.isActive = true; // Default: active only
    }

    // Dynamic string spec filters (e.g. attr[package]=0805)
    if (queryParams.attr && typeof queryParams.attr === 'object') {
      for (const [key, val] of Object.entries(queryParams.attr)) {
        if (val) {
          filter[`attributes.${key}`] = val;
        }
      }
    }

    const sortOption = queryParams.sort || 'price';

    return executePaginatedQuery(ProductVariant, filter, {
      ...queryParams,
      sort: sortOption,
    });
  }

  /**
   * Generic Parametric Search across components without category-specific code branches.
   */
  public static async parametricSearch(queryParams: any) {
    const filter: Record<string, any> = { isActive: true };

    // Resolve Category filter to target product families
    if (queryParams.category) {
      let categoryId = queryParams.category;
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        const cat = await Category.findOne({ slug: queryParams.category }).select('_id');
        if (cat) categoryId = cat._id;
      }
      const parentProductIds = await Product.find({ category: categoryId, productType: 'family' }).distinct('_id');
      filter.productId = { $in: parentProductIds };
    }

    // Generic Numerical Attribute Range Filtering (numAttr[key][gte] & numAttr[key][lte])
    if (queryParams.numAttr && typeof queryParams.numAttr === 'object') {
      for (const [key, range] of Object.entries(queryParams.numAttr as Record<string, any>)) {
        const numFilter: Record<string, number> = {};
        if (range.gte !== undefined && range.gte !== '') numFilter.$gte = Number(range.gte);
        if (range.lte !== undefined && range.lte !== '') numFilter.$lte = Number(range.lte);
        if (Object.keys(numFilter).length > 0) {
          filter[`numericalAttributes.${key}`] = numFilter;
        }
      }
    }

    // Generic String Attribute Filtering (attr[key]=val)
    if (queryParams.attr && typeof queryParams.attr === 'object') {
      for (const [key, val] of Object.entries(queryParams.attr as Record<string, any>)) {
        if (val) {
          filter[`attributes.${key}`] = val;
        }
      }
    }

    if (queryParams.inStock === 'true' || queryParams.inStock === true) {
      filter.stock = { $gt: 0 };
    }

    const sortOption = queryParams.sort || 'price';

    return executePaginatedQuery(ProductVariant, filter, {
      ...queryParams,
      sort: sortOption,
      populate: [{ path: 'productId', select: 'name slug category brand productType' }],
    });
  }
}
