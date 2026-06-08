// ============================================================================
// ElectroKart — Brand Service
// ============================================================================
// Manages brand profiles CRUD operations.
// ============================================================================

import Brand from '../models/Brand.model.js';
import Product from '../models/Product.model.js';
import { ApiError } from '../utils/index.js';

export class BrandService {
  /**
   * Computes live product counts per brand from the source of truth.
   *
   * The denormalized `productCount` on the Brand document was never refreshed on
   * product create/update/delete, so it always read 0. Counting on read keeps the
   * "popular brands" section accurate. Returns a map of brandId -> active count.
   */
  private static async getProductCounts(): Promise<Map<string, number>> {
    const counts = await Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
    ]);
    return new Map(counts.map((c) => [String(c._id), c.count]));
  }

  /**
   * Retrieves all active brands.
   */
  public static async getBrands(includeInactive: boolean = false): Promise<any[]> {
    const query = includeInactive ? {} : { isActive: true };
    const [brands, countMap] = await Promise.all([
      Brand.find(query).sort({ name: 1 }).lean(),
      this.getProductCounts(),
    ]);

    return brands.map((brand) => ({
      ...brand,
      productCount: countMap.get(String(brand._id)) ?? 0,
    }));
  }

  /**
   * Retrieves a single brand profile by its unique URL slug.
   */
  public static async getBrandBySlug(slug: string): Promise<any> {
    const brand = await Brand.findOne({ slug, isActive: true }).lean();
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }

    const productCount = await Product.countDocuments({ brand: brand._id, isActive: true });
    return { ...brand, productCount };
  }

  /**
   * Creates a brand.
   */
  public static async createBrand(dto: any): Promise<InstanceType<typeof Brand>> {
    const nameCollision = await Brand.findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } });
    if (nameCollision) {
      throw ApiError.conflict(`Brand with name "${dto.name}" already exists.`);
    }

    const brand = await Brand.create({
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      website: dto.website,
      countryOfOrigin: dto.countryOfOrigin,
      isActive: dto.isActive,
    });

    return brand;
  }

  /**
   * Modifies an existing brand.
   */
  public static async updateBrand(brandId: string, dto: any): Promise<InstanceType<typeof Brand>> {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }

    if (dto.name && dto.name.toLowerCase() !== brand.name.toLowerCase()) {
      const nameCollision = await Brand.exists({
        name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
        _id: { $ne: brandId },
      });
      if (nameCollision) {
        throw ApiError.conflict(`Brand with name "${dto.name}" already exists.`);
      }
    }

    Object.assign(brand, dto);
    await brand.save();

    return brand;
  }

  /**
   * Deletes a brand. Blocks deletion if products are mapped to it.
   */
  public static async deleteBrand(brandId: string): Promise<void> {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }

    const productsCount = await Product.countDocuments({ brand: brandId, isActive: true });
    if (productsCount > 0) {
      throw new ApiError(400, `Cannot delete brand. There are ${productsCount} active products associated with it.`);
    }

    await Brand.deleteOne({ _id: brandId });
  }

  /**
   * Recalculates denormalized product counts.
   */
  public static async updateProductCount(brandId: string): Promise<void> {
    const count = await Product.countDocuments({ brand: brandId, isActive: true });
    await Brand.findByIdAndUpdate(brandId, { productCount: count });
  }
}

export default BrandService;
