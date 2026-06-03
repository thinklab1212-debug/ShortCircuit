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
   * Retrieves all active brands.
   */
  public static async getBrands(includeInactive: boolean = false): Promise<InstanceType<typeof Brand>[]> {
    const query = includeInactive ? {} : { isActive: true };
    return Brand.find(query).sort({ name: 1 });
  }

  /**
   * Retrieves a single brand profile by its unique URL slug.
   */
  public static async getBrandBySlug(slug: string): Promise<InstanceType<typeof Brand>> {
    const brand = await Brand.findOne({ slug, isActive: true });
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }
    return brand;
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
