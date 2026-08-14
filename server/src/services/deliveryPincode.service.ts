// ============================================================================
// ShortCircuit — Delivery Pincode Service
// ============================================================================
// Business logic for delivery serviceability checks and admin CRUD.
//
// Currently global: if a pincode is active, all products are deliverable.
// The optional `productId` parameter in `checkServiceability` is a forward-
// looking hook for future per-product delivery restrictions.
// ============================================================================

import DeliveryPincode from '../models/DeliveryPincode.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export class DeliveryPincodeService {
  /**
   * Customer-facing serviceability check.
   * Returns a clean result indicating whether delivery is available.
   *
   * @param pincode  - 6-digit Indian pincode
   * @param productId - (reserved for future per-product restrictions)
   */
  public static async checkServiceability(
    pincode: string,
    _productId?: string
  ): Promise<{ deliverable: boolean; pincode: string; message: string }> {
    const record = await DeliveryPincode.findOne({ pincode, isActive: true }).lean();

    if (record) {
      return {
        deliverable: true,
        pincode,
        message: 'Delivery available at this pincode',
      };
    }

    return {
      deliverable: false,
      pincode,
      message: 'Delivery is not available at this pincode',
    };
  }

  /**
   * Lightweight boolean check used internally (e.g., by OrderService).
   */
  public static async isPincodeServiceable(pincode: string): Promise<boolean> {
    const exists = await DeliveryPincode.exists({ pincode, isActive: true });
    return !!exists;
  }

  // ─── Admin CRUD ─────────────────────────────────────────────────────────────

  /**
   * Creates a new delivery pincode entry.
   */
  public static async create(data: {
    pincode: string;
    city?: string;
    state?: string;
    isActive?: boolean;
  }): Promise<InstanceType<typeof DeliveryPincode>> {
    // Check duplicate
    const existing = await DeliveryPincode.findOne({ pincode: data.pincode });
    if (existing) {
      throw ApiError.conflict(`Pincode "${data.pincode}" already exists.`);
    }

    const record = await DeliveryPincode.create(data);
    return record;
  }

  /**
   * Retrieves a paginated, searchable list of delivery pincodes.
   */
  public static async getAll(queryParams: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const filter: Record<string, unknown> = {};

    if (typeof queryParams.isActive === 'boolean') {
      filter.isActive = queryParams.isActive;
    }

    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search, 'i');
      filter.$or = [
        { pincode: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ];
    }

    return executePaginatedQuery(DeliveryPincode, filter, {
      ...queryParams,
      sort: '-createdAt',
    });
  }

  /**
   * Updates an existing delivery pincode.
   */
  public static async update(
    id: string,
    data: {
      pincode?: string;
      city?: string;
      state?: string;
      isActive?: boolean;
    }
  ): Promise<InstanceType<typeof DeliveryPincode>> {
    const record = await DeliveryPincode.findById(id);
    if (!record) {
      throw ApiError.notFound('Delivery pincode not found.');
    }

    // If pincode is being changed, check for duplicates
    if (data.pincode && data.pincode !== record.pincode) {
      const existing = await DeliveryPincode.findOne({ pincode: data.pincode });
      if (existing) {
        throw ApiError.conflict(`Pincode "${data.pincode}" already exists.`);
      }
    }

    Object.assign(record, data);
    await record.save();
    return record;
  }

  /**
   * Toggles the active/inactive status of a delivery pincode.
   */
  public static async toggleStatus(
    id: string,
    isActive: boolean
  ): Promise<InstanceType<typeof DeliveryPincode>> {
    const record = await DeliveryPincode.findById(id);
    if (!record) {
      throw ApiError.notFound('Delivery pincode not found.');
    }

    record.isActive = isActive;
    await record.save();
    return record;
  }

  /**
   * Permanently deletes a delivery pincode.
   */
  public static async remove(id: string): Promise<void> {
    const record = await DeliveryPincode.findById(id);
    if (!record) {
      throw ApiError.notFound('Delivery pincode not found.');
    }

    await record.deleteOne();
  }
}

export default DeliveryPincodeService;
