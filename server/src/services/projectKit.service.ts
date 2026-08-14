// ============================================================================
// ElectroKart — ProjectKit Service
// ============================================================================
// Business logic for the Smart Project Builder. Handles public browsing,
// BOM pricing with live product data, add-kit-to-cart flow, and admin CRUD.
// ============================================================================

import mongoose from 'mongoose';
import ProjectKit from '../models/ProjectKit.model.js';
import Order from '../models/Order.model.js';
import type { IProduct } from '../models/Product.model.js';
import { CartService } from './cart.service.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// ---------------------------------------------------------------------------
// Population config (consistent with cart/wishlist)
// ---------------------------------------------------------------------------

const BOM_POPULATE = {
  path: 'components.product',
  select: 'name slug images price salePrice stock isActive sku',
};

export class ProjectKitService {
  // ─── Public: List active projects ─────────────────────────────────────────

  /**
   * Returns paginated, filterable list of active projects for public browsing.
   */
  public static async getActiveProjects(queryParams: {
    page?: number;
    limit?: number;
    applicationArea?: string;
    difficulty?: string;
    search?: string;
    sort?: string;
  }) {
    const filter: Record<string, any> = { isActive: true };

    if (queryParams.applicationArea) {
      filter.applicationArea = queryParams.applicationArea;
    }
    if (queryParams.difficulty) {
      filter.difficulty = queryParams.difficulty;
    }
    if (queryParams.search) {
      filter.$text = { $search: queryParams.search };
    }

    // Determine sort order
    let sortOption: string | Record<string, 1 | -1> = { createdAt: -1 };
    switch (queryParams.sort) {
      case 'popular':
        sortOption = { viewCount: -1, createdAt: -1 };
        break;
      case 'featured':
        sortOption = { isFeatured: -1, displayOrder: 1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    return executePaginatedQuery(ProjectKit, filter, {
      page: queryParams.page,
      limit: queryParams.limit || 12,
      sort: sortOption,
      populate: [BOM_POPULATE],
    });
  }

  // ─── Public: Featured projects (homepage) ─────────────────────────────────

  /**
   * Returns up to 6 featured active projects for homepage display.
   */
  public static async getFeaturedProjects() {
    return ProjectKit.find({ isActive: true, isFeatured: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(6)
      .populate(BOM_POPULATE)
      .lean();
  }

  // ─── Delivery Gate: Access Status Check ────────────────────────────────────

  /**
   * Checks whether a user (or admin) has unlocked access to project build guides & code.
   * Admin role automatically grants access.
   * Customers must have at least one 'delivered' order containing a component from this kit.
   */
  public static async checkProjectAccess(
    userId?: string,
    userRole?: string,
    projectIdOrSlug?: string
  ): Promise<{
    isUnlocked: boolean;
    reason: 'admin' | 'delivered' | 'not_purchased' | 'not_delivered' | 'unauthenticated';
    deliveredOrderDate?: Date;
  }> {
    if (userRole === 'admin') {
      return { isUnlocked: true, reason: 'admin' };
    }

    if (!userId) {
      return { isUnlocked: false, reason: 'unauthenticated' };
    }

    // 1. Resolve project kit to get BOM component product IDs
    const isObjectId = mongoose.isValidObjectId(projectIdOrSlug);
    const query = isObjectId ? { _id: projectIdOrSlug } : { slug: projectIdOrSlug };

    const project = await ProjectKit.findOne(query).select('components.product');

    if (!project) {
      return { isUnlocked: false, reason: 'not_purchased' };
    }

    const componentProductIds = project.components.map((c) => c.product.toString());

    // 2. Check if user has a delivered order containing any of these products
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': { $in: componentProductIds },
      orderStatus: 'delivered',
    }).select('deliveredAt createdAt');

    if (deliveredOrder) {
      return {
        isUnlocked: true,
        reason: 'delivered',
        deliveredOrderDate: deliveredOrder.deliveredAt || deliveredOrder.createdAt,
      };
    }

    // 3. Check if user has an active order in progress that is not delivered yet
    const activeOrder = await Order.findOne({
      user: userId,
      'items.product': { $in: componentProductIds },
      orderStatus: { $in: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'] },
    }).select('orderStatus');

    if (activeOrder) {
      return { isUnlocked: false, reason: 'not_delivered' };
    }

    return { isUnlocked: false, reason: 'not_purchased' };
  }

  // ─── Public: Project detail by slug ───────────────────────────────────────

  /**
   * Returns full project detail and atomically increments view count.
   * Strips raw Google Drive document URLs if document access is locked.
   */
  public static async getProjectBySlug(slug: string, userId?: string, userRole?: string) {
    const project = await ProjectKit.findOneAndUpdate(
      { slug, isActive: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate(BOM_POPULATE);

    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const access = await this.checkProjectAccess(userId, userRole, project._id.toString());
    const projectObj = project.toObject();

    if (!access.isUnlocked && projectObj.documents) {
      // Strip actual URLs for public visitors / non-delivered buyers
      projectObj.documents = projectObj.documents.map((doc: any) => ({
        _id: doc._id,
        title: doc.title,
        type: doc.type,
        url: '', // Stripped until delivery
        isLocked: true,
      }));
    }

    return {
      ...projectObj,
      access,
    };
  }

  /**
   * Retrieves unlocked document URLs for a specific project. Requires delivery or admin.
   */
  public static async getProjectDocuments(userId: string, userRole: string, projectId: string) {
    const access = await this.checkProjectAccess(userId, userRole, projectId);

    if (!access.isUnlocked) {
      throw new ApiError(
        403,
        'Project guide and source code access is locked until your kit order is delivered.'
      );
    }

    const project = await ProjectKit.findById(projectId).select('name documents');
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    return {
      projectName: project.name,
      documents: project.documents,
      access,
    };
  }

  // ─── Public: BOM with live pricing ────────────────────────────────────────

  /**
   * Returns BOM components with live pricing, per-item subtotals,
   * stock status, and aggregate cost summary.
   */
  public static async getProjectBom(slug: string) {
    const project = await ProjectKit.findOne({ slug, isActive: true }).populate(
      BOM_POPULATE
    );

    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const components = project.components.map((comp) => {
      const product = comp.product as unknown as IProduct;

      // Handle edge case: product deleted or deactivated
      if (!product || !product.isActive) {
        return {
          _id: comp._id,
          product: comp.product,
          quantity: comp.quantity,
          note: comp.note,
          isOptional: comp.isOptional,
          unitPrice: 0,
          effectivePrice: 0,
          subtotal: 0,
          inStock: false,
          availableStock: 0,
        };
      }

      const unitPrice = product.price;
      const effectivePrice = product.salePrice || product.price;

      return {
        _id: comp._id,
        product,
        quantity: comp.quantity,
        note: comp.note,
        isOptional: comp.isOptional,
        unitPrice,
        effectivePrice,
        subtotal: effectivePrice * comp.quantity,
        inStock: product.stock >= comp.quantity,
        availableStock: product.stock,
      };
    });

    const totalMrp = components.reduce(
      (sum, c) => sum + c.unitPrice * c.quantity,
      0
    );
    const totalPrice = components.reduce((sum, c) => sum + c.subtotal, 0);

    return {
      components,
      summary: {
        totalItems: components.length,
        totalQuantity: components.reduce((s, c) => s + c.quantity, 0),
        totalMrp,
        totalPrice,
        savings: totalMrp - totalPrice,
        allInStock: components.every((c) => c.inStock),
        outOfStockCount: components.filter((c) => !c.inStock).length,
      },
    };
  }

  // ─── Auth: Add entire BOM to cart ─────────────────────────────────────────

  /**
   * Adds all required (non-optional) BOM components to the user's cart.
   * Returns summary of successes and failures.
   */
  public static async addProjectToCart(userId: string, projectId: string) {
    const project = await ProjectKit.findById(projectId).populate(BOM_POPULATE);

    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const added: { name: string; quantity: number }[] = [];
    const skipped: { name: string; reason: string }[] = [];
    const failed: { name: string; reason: string }[] = [];

    for (const comp of project.components) {
      const product = comp.product as unknown as IProduct;

      // Skip optional components
      if (comp.isOptional) {
        skipped.push({
          name: product?.name || 'Unknown Product',
          reason: 'Optional component — skipped',
        });
        continue;
      }

      // Skip inactive/deleted products
      if (!product || !product.isActive) {
        failed.push({
          name: 'Unknown Product',
          reason: 'Product is no longer available',
        });
        continue;
      }

      try {
        await CartService.addToCart(userId, product._id.toString(), undefined, comp.quantity);
        added.push({ name: product.name, quantity: comp.quantity });
      } catch (error: any) {
        failed.push({
          name: product.name,
          reason: error.message || 'Failed to add to cart',
        });
      }
    }

    return { added, skipped, failed };
  }

  // ─── Admin: List all projects (including drafts) ──────────────────────────

  /**
   * Returns paginated list of all projects for admin management.
   */
  public static async getAllProjects(queryParams: any) {
    return executePaginatedQuery(ProjectKit, {}, {
      ...queryParams,
      sort: queryParams.sort || { createdAt: -1 },
      populate: [BOM_POPULATE],
    });
  }

  // ─── Admin: Get single project by ID ──────────────────────────────────────

  /**
   * Returns a single project by ID for admin editing. Does NOT require isActive.
   */
  public static async getProjectById(projectId: string) {
    const project = await ProjectKit.findById(projectId).populate(BOM_POPULATE);

    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    return project;
  }

  // ─── Admin: Create project ────────────────────────────────────────────────

  /**
   * Creates a new project kit.
   */
  public static async createProject(dto: any) {
    const project = await ProjectKit.create({
      name: dto.name,
      description: dto.description,
      shortDescription: dto.shortDescription,
      coverImage: dto.coverImage,
      difficulty: dto.difficulty,
      applicationArea: dto.applicationArea,
      tags: dto.tags,
      estimatedTime: dto.estimatedTime,
      components: dto.components,
      instructions: dto.instructions,
      wiringDiagrams: dto.wiringDiagrams,
      documents: dto.documents,
      isActive: dto.isActive,
      isFeatured: dto.isFeatured,
      displayOrder: dto.displayOrder,
    });

    // Return populated version
    return ProjectKit.findById(project._id).populate(BOM_POPULATE);
  }

  // ─── Admin: Update project ────────────────────────────────────────────────

  /**
   * Updates an existing project kit.
   */
  public static async updateProject(projectId: string, dto: any) {
    const project = await ProjectKit.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    Object.assign(project, dto);
    await project.save();

    return ProjectKit.findById(project._id).populate(BOM_POPULATE);
  }

  // ─── Admin: Delete project ────────────────────────────────────────────────

  /**
   * Permanently deletes a project kit.
   */
  public static async deleteProject(projectId: string) {
    const project = await ProjectKit.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    await ProjectKit.deleteOne({ _id: projectId });
  }
}

export default ProjectKitService;
