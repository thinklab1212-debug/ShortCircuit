// ============================================================================
// ElectroKart — Banner Service
// ============================================================================
// Manages storefront promotional banners and administrative listings.
// ============================================================================

import Banner from '../models/Banner.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export class BannerService {
  /**
   * Retrieves active banners scheduled for display on the homepage.
   */
  public static async getActiveBanners(): Promise<InstanceType<typeof Banner>[]> {
    const today = new Date();
    
    return Banner.find({
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: today } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: today } },
          ],
        },
      ],
    })
      .sort({ position: 1, createdAt: -1 })
      .populate('category', 'name slug');
  }

  /**
   * Retrieves all banners (Admin only, paginated).
   */
  public static async getAllBanners(queryParams: any) {
    return executePaginatedQuery(Banner, {}, {
      ...queryParams,
      sort: 'position',
      populate: [{ path: 'category', select: 'name slug' }],
    });
  }

  /**
   * Creates a new banner (Admin only).
   */
  public static async createBanner(dto: any): Promise<InstanceType<typeof Banner>> {
    const banner = await Banner.create({
      title: dto.title,
      subtitle: dto.subtitle,
      description: dto.description,
      image: dto.image,
      mobileImage: dto.mobileImage,
      link: dto.link,
      linkText: dto.linkText,
      category: dto.category,
      backgroundColor: dto.backgroundColor,
      textColor: dto.textColor,
      position: dto.position,
      isActive: dto.isActive,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    return banner;
  }

  /**
   * Modifies an existing banner (Admin only).
   */
  public static async updateBanner(bannerId: string, dto: any): Promise<InstanceType<typeof Banner>> {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      throw ApiError.notFound('Banner not found.');
    }

    Object.assign(banner, dto);
    await banner.save();

    return banner;
  }

  /**
   * Deletes a banner (Admin only).
   */
  public static async deleteBanner(bannerId: string): Promise<void> {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      throw ApiError.notFound('Banner not found.');
    }

    await Banner.deleteOne({ _id: bannerId });
  }
}

export default BannerService;
