// ============================================================================
// ElectroKart — User Service
// ============================================================================
// Manages profile modifications, admin user list queries, and account states.
// ============================================================================

import User from '../models/User.model.js';
import Token from '../models/Token.model.js';
import { ApiError } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import { UserRole } from '../interfaces/auth.interface.js';

export class UserService {
  /**
   * Retrieves a single user profile.
   */
  public static async getProfile(userId: string): Promise<InstanceType<typeof User>> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Modifies a user profile (names, phone).
   */
  public static async updateProfile(
    userId: string,
    updateData: { firstName?: string; lastName?: string; phone?: string }
  ): Promise<InstanceType<typeof User>> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
    if (updateData.phone !== undefined) user.phone = updateData.phone;

    await user.save();
    return user;
  }

  /**
   * Updates a user's avatar image (Cloudinary details).
   */
  public static async updateAvatar(
    userId: string,
    avatar: { url: string; publicId: string }
  ): Promise<InstanceType<typeof User>> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    user.avatar = avatar;
    await user.save();
    return user;
  }

  /**
   * Lists all registered users (Admin only, paginated).
   */
  public static async getAllUsers(queryParams: any) {
    const filter = {}; // Extend filters if administrative searches are required
    const result = await executePaginatedQuery(User, filter, queryParams);
    return result;
  }

  /**
   * Retrieves administrative details for a single user by ID.
   */
  public static async getUserById(userId: string): Promise<InstanceType<typeof User>> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Toggles blocking/suspending user accounts (Admin only).
   */
  public static async toggleBlockUser(userId: string): Promise<InstanceType<typeof User>> {
    const user = await User.findById(userId).select('+isBlocked');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    if (user.isBlocked) {
      await Token.deleteMany({ userId: user._id });
    }

    return user;
  }

  /**
   * Administrative role changes (Admin only).
   */
  public static async changeUserRole(userId: string, role: UserRole): Promise<InstanceType<typeof User>> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    user.role = role;
    await user.save();
    return user;
  }
}

export default UserService;
