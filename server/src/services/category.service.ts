// ============================================================================
// ElectroKart — Category Service
// ============================================================================
// Manages category CRUD and builds hierarchical category trees.
// ============================================================================

import Category from '../models/Category.model.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/index.js';

export class CategoryService {
  /**
   * Computes live product counts per category from the source of truth.
   *
   * The denormalized `productCount` on the Category document only gets refreshed
   * on admin product create/update/delete, so it drifts for seeded/bulk-imported
   * products. Counting on read guarantees the home and category pages are accurate.
   * Returns a map of categoryId -> active product count.
   */
  private static async getProductCounts(): Promise<Map<string, number>> {
    const counts = await Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    return new Map(counts.map((c) => [String(c._id), c.count]));
  }

  /**
   * Retrieves all categories, flat or grouped (Admin).
   */
  public static async getCategories(): Promise<any[]> {
    const [categories, countMap] = await Promise.all([
      Category.find().sort({ displayOrder: 1, name: 1 }).lean(),
      this.getProductCounts(),
    ]);

    return categories.map((cat) => ({
      ...cat,
      productCount: countMap.get(String(cat._id)) ?? 0,
    }));
  }

  /**
   * Builds and returns a nested category tree representation for navigation.
   */
  public static async getCategoryTree(): Promise<any[]> {
    const [flatCategories, countMap] = await Promise.all([
      Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean(),
      this.getProductCounts(),
    ]);

    const categoryMap: Record<string, any> = {};
    const rootCategories: any[] = [];

    // Map categories and initialize subcategory arrays
    for (const cat of flatCategories) {
      categoryMap[cat._id.toString()] = {
        ...cat,
        productCount: countMap.get(String(cat._id)) ?? 0,
        subcategories: [],
      };
    }

    // Build hierarchy
    for (const cat of flatCategories) {
      const mapped = categoryMap[cat._id.toString()];
      if (cat.parent) {
        const parentId = cat.parent.toString();
        if (categoryMap[parentId]) {
          categoryMap[parentId].subcategories.push(mapped);
        } else {
          // If parent is inactive, treat as root
          rootCategories.push(mapped);
        }
      } else {
        rootCategories.push(mapped);
      }
    }

    return rootCategories;
  }

  /**
   * Creates a new category.
   */
  public static async createCategory(dto: any): Promise<InstanceType<typeof Category>> {
    // Check name collision
    const nameCollision = await Category.findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } });
    if (nameCollision) {
      throw ApiError.conflict(`Category name "${dto.name}" already exists.`);
    }

    // Verify parent category if present
    if (dto.parent) {
      const parentExists = await Category.exists({ _id: dto.parent });
      if (!parentExists) {
        throw ApiError.badRequest('Parent category does not exist.');
      }
    }

    const category = await Category.create({
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      parent: dto.parent,
      isActive: dto.isActive,
      displayOrder: dto.displayOrder,
    });

    return category;
  }

  /**
   * Modifies an existing category.
   */
  public static async updateCategory(
    categoryId: string,
    dto: any
  ): Promise<InstanceType<typeof Category>> {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    // Check name collision if name is changing
    if (dto.name && dto.name.toLowerCase() !== category.name.toLowerCase()) {
      const nameCollision = await Category.exists({
        name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
        _id: { $ne: categoryId },
      });
      if (nameCollision) {
        throw ApiError.conflict(`Category name "${dto.name}" already exists.`);
      }
    }

    // Prevent category from referencing itself as parent
    if (dto.parent && dto.parent.toString() === categoryId.toString()) {
      throw ApiError.badRequest('A category cannot have itself as a parent.');
    }

    // Verify parent category if updated
    if (dto.parent && dto.parent.toString() !== category.parent?.toString()) {
      const parentExists = await Category.exists({ _id: dto.parent });
      if (!parentExists) {
        throw ApiError.badRequest('Parent category does not exist.');
      }
    }

    Object.assign(category, dto);
    await category.save();

    return category;
  }

  /**
   * Deletes a category. Prevents deletion if any products are mapped to it.
   */
  public static async deleteCategory(categoryId: string): Promise<void> {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    // 1. Block if products are associated
    const productsCount = await Product.countDocuments({ category: categoryId, isActive: true });
    if (productsCount > 0) {
      throw new ApiError(400, `Cannot delete category. There are ${productsCount} active products assigned to it.`);
    }

    // 2. Block if it has active child subcategories
    const subcategoriesCount = await Category.countDocuments({ parent: categoryId, isActive: true });
    if (subcategoriesCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category. It has ${subcategoriesCount} active subcategories. Delete children first.`
      );
    }

    // 3. Delete category
    await Category.deleteOne({ _id: categoryId });
  }

  /**
   * Recalculates denormalized product counts.
   */
  public static async recalculateCategoryCounts(categoryId: string): Promise<void> {
    await Category.updateProductCount(categoryId as any);
  }
}

export default CategoryService;
