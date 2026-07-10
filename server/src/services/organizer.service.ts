// ============================================================================
// Short Circuit — Organizer Service
// ============================================================================
// Business logic for the Organizer Application workflow:
//   - Customer submits application to become an organizer
//   - Admin lists, reviews (approve/reject) applications
//   - On approval, User.isOrganizer is set to true
//   - On rejection, user can reapply (previous application is updated)
//
// Authorization:
//   - Only authenticated users can apply (enforced by auth middleware)
//   - Only admins can approve/reject (enforced by role middleware)
//   - isOrganizer is additive — does NOT change the User.role field
// ============================================================================

import mongoose from 'mongoose';
import OrganizerApplication from '../models/OrganizerApplication.model.js';
import User from '../models/User.model.js';
import { ApiError } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface IApplyDTO {
  organizationName: string;
  collegeName: string;
  contactNumber: string;
}

interface IPaginatedResult {
  docs: any[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class OrganizerService {
  /**
   * Submits a new organizer application for the authenticated user.
   *
   * Rules:
   *   - Users with an existing 'pending' or 'approved' application cannot re-apply.
   *   - Users whose previous application was 'rejected' CAN reapply (old record is updated).
   *   - Admins and vendors can also apply (organizer is additive).
   */
  public static async applyAsOrganizer(
    userId: string,
    dto: IApplyDTO
  ) {
    // Check if user is already an organizer
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    if (user.isOrganizer) {
      throw ApiError.conflict('You are already an approved organizer.');
    }

    // Check for existing applications
    const existing = await OrganizerApplication.findOne({ user: userId });

    if (existing) {
      if (existing.status === 'pending') {
        throw ApiError.conflict(
          'You already have a pending organizer application. Please wait for admin review.'
        );
      }

      if (existing.status === 'approved') {
        throw ApiError.conflict('Your organizer application has already been approved.');
      }

      // Status is 'rejected' — allow reapplication by updating existing record
      existing.organizationName = dto.organizationName;
      existing.collegeName = dto.collegeName;
      existing.contactNumber = dto.contactNumber;
      existing.status = 'pending';
      existing.adminResponse = undefined;
      existing.reviewedBy = undefined;
      existing.reviewedAt = undefined;
      await existing.save();

      return existing;
    }

    // No existing application — create new
    const application = await OrganizerApplication.create({
      user: userId,
      organizationName: dto.organizationName,
      collegeName: dto.collegeName,
      contactNumber: dto.contactNumber,
    });

    return application;
  }

  /**
   * Retrieves the authenticated user's own application status.
   * Returns null if no application exists (not an error).
   */
  public static async getMyApplication(userId: string) {
    const application = await OrganizerApplication.findOne({ user: userId });
    return application;
  }

  /**
   * Lists all organizer applications for admin review (paginated).
   * Supports filtering by status and sorting by createdAt.
   */
  public static async getAllApplications(queryParams: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<IPaginatedResult> {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(50, Math.max(1, queryParams.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (queryParams.status && ['pending', 'approved', 'rejected'].includes(queryParams.status)) {
      filter.status = queryParams.status;
    }

    const [docs, totalResults] = await Promise.all([
      OrganizerApplication.find(filter)
        .populate('user', 'firstName lastName email phone avatar role')
        .populate('reviewedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrganizerApplication.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      docs,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves a single application by ID for admin review.
   */
  public static async getApplicationById(applicationId: string) {
    const application = await OrganizerApplication.findById(applicationId)
      .populate('user', 'firstName lastName email phone avatar role isOrganizer createdAt')
      .populate('reviewedBy', 'firstName lastName email')
      .lean();

    if (!application) {
      throw ApiError.notFound('Organizer application not found.');
    }

    return application;
  }

  /**
   * Approves an organizer application.
   *
   * Side effects:
   *   - Sets User.isOrganizer = true
   *   - Records reviewedBy and reviewedAt
   */
  public static async approveApplication(
    applicationId: string,
    adminUserId: string,
    adminResponse?: string
  ) {
    const application = await OrganizerApplication.findById(applicationId);

    if (!application) {
      throw ApiError.notFound('Organizer application not found.');
    }

    if (application.status === 'approved') {
      throw ApiError.conflict('This application has already been approved.');
    }

    if (application.status !== 'pending') {
      throw ApiError.badRequest(
        `Cannot approve an application with status '${application.status}'. Only pending applications can be approved.`
      );
    }

    // Update application status
    application.status = 'approved';
    application.adminResponse = adminResponse || 'Application approved.';
    application.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    application.reviewedAt = new Date();
    await application.save();

    // Grant organizer privileges and persist profile on the user
    await User.findByIdAndUpdate(application.user, {
      isOrganizer: true,
      organizerStatus: 'active',
      organizerProfile: {
        organizationName: application.organizationName,
        collegeName: application.collegeName,
        contactNumber: application.contactNumber,
        approvedAt: new Date(),
      },
    });

    return application;
  }

  /**
   * Rejects an organizer application with an optional reason.
   *
   * The user can reapply after rejection.
   */
  public static async rejectApplication(
    applicationId: string,
    adminUserId: string,
    adminResponse?: string
  ) {
    const application = await OrganizerApplication.findById(applicationId);

    if (!application) {
      throw ApiError.notFound('Organizer application not found.');
    }

    if (application.status === 'rejected') {
      throw ApiError.conflict('This application has already been rejected.');
    }

    if (application.status !== 'pending') {
      throw ApiError.badRequest(
        `Cannot reject an application with status '${application.status}'. Only pending applications can be rejected.`
      );
    }

    // Update application status
    application.status = 'rejected';
    application.adminResponse = adminResponse || 'Application rejected.';
    application.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    application.reviewedAt = new Date();
    await application.save();

    return application;
  }
}

export default OrganizerService;
