// ============================================================================
// ElectroKart — Address Service
// ============================================================================
// Handles user shipping/billing address CRUD and default state configurations.
// Enforces a maximum limit of 10 addresses per user.
// ============================================================================

import Address from '../models/Address.model.js';
import { ApiError } from '../utils/index.js';

export class AddressService {
  /**
   * Retrieves all shipping addresses for a single user.
   */
  public static async getAddresses(userId: string): Promise<InstanceType<typeof Address>[]> {
    return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  /**
   * Creates a shipping address. Enforces the 10-address limit.
   */
  public static async createAddress(userId: string, dto: any): Promise<InstanceType<typeof Address>> {
    // 1. Check address counts
    const count = await Address.countDocuments({ user: userId });
    if (count >= 10) {
      throw new ApiError(400, 'Address limit reached. You can store at most 10 addresses.');
    }

    // 2. If this is the first address, force it to be default
    const isFirstAddress = count === 0;
    const isDefault = isFirstAddress || dto.isDefault === true;

    // 3. If set as default, unset other defaults first (ensured by Mongoose pre-save, but done here for explicit safety)
    if (isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    // 4. Create new address
    const address = await Address.create({
      user: userId,
      fullName: dto.fullName,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      landmark: dto.landmark,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      type: dto.type,
      isDefault,
    });

    return address;
  }

  /**
   * Modifies an address.
   */
  public static async updateAddress(
    userId: string,
    addressId: string,
    dto: any
  ): Promise<InstanceType<typeof Address>> {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized.');
    }

    // If default toggle is changed to true, unset others
    if (dto.isDefault === true && !address.isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
      address.isDefault = true;
    } else if (dto.isDefault === false && address.isDefault) {
      // Prevent un-defaulting the only default address if others exist
      const otherAddressesCount = await Address.countDocuments({ user: userId, _id: { $ne: addressId } });
      if (otherAddressesCount > 0) {
        throw new ApiError(400, 'You must have at least one default shipping address.');
      }
    }

    if (dto.fullName !== undefined) address.fullName = dto.fullName;
    if (dto.phone !== undefined) address.phone = dto.phone;
    if (dto.addressLine1 !== undefined) address.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) address.addressLine2 = dto.addressLine2;
    if (dto.landmark !== undefined) address.landmark = dto.landmark;
    if (dto.city !== undefined) address.city = dto.city;
    if (dto.state !== undefined) address.state = dto.state;
    if (dto.pincode !== undefined) address.pincode = dto.pincode;
    if (dto.type !== undefined) address.type = dto.type;

    await address.save();
    return address;
  }

  /**
   * Deletes an address. If the default address is deleted, assigns default to another one.
   */
  public static async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized.');
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: addressId });

    // If the deleted address was default, promote the next newest address to default
    if (wasDefault) {
      const nextAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }
  }

  /**
   * Explicitly updates the default shipping address.
   */
  public static async setDefaultAddress(userId: string, addressId: string): Promise<InstanceType<typeof Address>> {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized.');
    }

    // Unset current default(s)
    await Address.updateMany({ user: userId }, { isDefault: false });

    // Set target default
    address.isDefault = true;
    await address.save();

    return address;
  }
}

export default AddressService;
