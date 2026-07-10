// ============================================================================
// Short Circuit — Event Service
// ============================================================================
// Business logic for the Event Commerce Module.
//
// Phase 3 implements:
//   - Organizer CRUD: create, list, get, update, delete draft events
//   - Submit for review (placeholder)
//
// Phase 4 will implement:
//   - Admin review (approve/reject)
//   - Public listing
//   - Team verification and purchase
//
// Key Architecture:
//   - Event Kits are Virtual Bundles (NO Product record created)
//   - Kit pricing is snapshotted at creation time (productName, priceAtCreation)
//   - totalKitValue = Σ(priceAtCreation × quantity) — stored, computed on save
//   - eventKitPrice = organizer-set selling price
//   - discount = totalKitValue − eventKitPrice — virtual
//   - Event purchases bypass Cart → use dedicated placeEventOrder() (Phase 4)
//   - Zero inventory impact on existing products
// ============================================================================

import mongoose from 'mongoose';
import Event from '../models/Event.model.js';
import { ApiError, logger } from '../utils/index.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import User from '../models/User.model.js';
import { EmailService } from './email.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import EventOrder from '../models/EventOrder.model.js';
import Address from '../models/Address.model.js';
import PaymentService from './payment.service.js';
import InvoiceService from './invoice.service.js';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface ICreateEventDTO {
  eventName: string;
  organizationName: string;
  collegeName: string;
  description: string;
  banner: { url: string; publicId: string };
  startDate: string;
  endDate: string;
  eventKitPrice: number;
  kitProducts: {
    product: string;
    productName: string;
    productSku: string;
    productImage?: string;
    priceAtCreation: number;
    quantity: number;
  }[];
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

export class EventService {
  // =========================================================================
  // Organizer: Event CRUD (Phase 3)
  // =========================================================================

  /**
   * Creates a new event in draft status.
   * totalKitValue is computed automatically in the pre-save hook.
   */
  public static async createEvent(userId: string, dto: ICreateEventDTO) {
    const event = await Event.create({
      organizer: new mongoose.Types.ObjectId(userId),
      eventName: dto.eventName,
      organizationName: dto.organizationName,
      collegeName: dto.collegeName,
      description: dto.description,
      banner: dto.banner,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      eventKitPrice: dto.eventKitPrice,
      // totalKitValue is computed in pre-save hook from kitProducts
      kitProducts: dto.kitProducts.map((p) => ({
        product: new mongoose.Types.ObjectId(p.product),
        productName: p.productName,
        productSku: p.productSku,
        productImage: p.productImage,
        priceAtCreation: p.priceAtCreation,
        quantity: p.quantity,
      })),
      status: 'draft',
    });

    return event;
  }

  /**
   * Lists the organizer's own events (paginated, sorted by newest).
   */
  public static async getOrganizerEvents(
    userId: string,
    queryParams: { page?: number; limit?: number; status?: string }
  ): Promise<IPaginatedResult> {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(50, Math.max(1, queryParams.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { organizer: userId };
    if (
      queryParams.status &&
      ['draft', 'pending', 'approved', 'rejected', 'completed'].includes(queryParams.status)
    ) {
      filter.status = queryParams.status;
    }

    const [docs, totalResults] = await Promise.all([
      Event.find(filter)
        .select('-teams')       // Exclude teams array for list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Event.countDocuments(filter),
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
   * Retrieves a single event by ID with ownership check.
   */
  public static async getOrganizerEventById(userId: string, eventId: string) {
    const event = await Event.findOne({
      _id: eventId,
      organizer: userId,
    })
      .populate('kitProducts.product', 'name slug images effectivePrice')
      .lean({ virtuals: true });

    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    return event;
  }

  /**
   * Updates an event (only if draft or rejected).
   */
  public static async updateEvent(
    userId: string,
    eventId: string,
    dto: Partial<ICreateEventDTO>
  ) {
    const event = await Event.findOne({
      _id: eventId,
      organizer: userId,
    });

    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    if (!['draft', 'rejected'].includes(event.status)) {
      throw ApiError.badRequest(
        `Cannot edit an event with status '${event.status}'. Only draft or rejected events can be edited.`
      );
    }

    // Apply updates
    if (dto.eventName !== undefined) event.eventName = dto.eventName;
    if (dto.organizationName !== undefined) event.organizationName = dto.organizationName;
    if (dto.collegeName !== undefined) event.collegeName = dto.collegeName;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.banner !== undefined) event.banner = dto.banner;
    if (dto.startDate !== undefined) event.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) event.endDate = new Date(dto.endDate);
    if (dto.eventKitPrice !== undefined) event.eventKitPrice = dto.eventKitPrice;
    if (dto.kitProducts !== undefined) {
      event.kitProducts = dto.kitProducts.map((p) => ({
        product: new mongoose.Types.ObjectId(p.product),
        productName: p.productName,
        productSku: p.productSku,
        productImage: p.productImage,
        priceAtCreation: p.priceAtCreation,
        quantity: p.quantity,
      })) as any;
    }

    // If previously rejected, reset back to draft on edit
    if (event.status === 'rejected') {
      event.status = 'draft';
      event.rejectionReason = undefined;
      event.reviewedBy = undefined;
      event.reviewedAt = undefined;
    }

    await event.save(); // Triggers pre-save: slug regen + totalKitValue recalc

    return event;
  }

  /**
   * Deletes an event (only if draft and no purchased teams).
   */
  public static async deleteEvent(userId: string, eventId: string) {
    const event = await Event.findOne({
      _id: eventId,
      organizer: userId,
    });

    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    if (event.status !== 'draft') {
      throw ApiError.badRequest(
        `Cannot delete an event with status '${event.status}'. Only draft events can be deleted.`
      );
    }

    const hasPurchases = event.teams.some((t) => t.purchased);
    if (hasPurchases) {
      throw ApiError.badRequest('Cannot delete an event that has purchased teams.');
    }

    await Event.deleteOne({ _id: eventId });
  }

  // =========================================================================
  // Organizer: Team Management & CSV Import (Phase 5)
  // =========================================================================

  /**
   * Helper to parse CSV data from a buffer.
   * Expects comma-separated format.
   * Filters out header row if it contains column labels, ignores blank lines, and trims values.
   */
  private static parseTeamsCSV(buffer: Buffer): { teamId: string; leaderName: string }[] {
    const text = buffer.toString('utf-8');
    const lines = text.split(/\r?\n/);
    const parsed: { teamId: string; leaderName: string }[] = [];

    let isFirstRow = true;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue; // Ignore blank lines

      // Simple comma split
      const parts = line.split(',');
      const teamId = parts[0]?.trim() || '';
      const leaderName = parts[1]?.trim() || '';

      // Skip header row if matches "team id" or "leader name"
      if (
        isFirstRow &&
        (teamId.toLowerCase().includes('team') ||
          leaderName.toLowerCase().includes('leader') ||
          teamId.toLowerCase() === 'team id' ||
          leaderName.toLowerCase() === 'leader name')
      ) {
        isFirstRow = false;
        continue;
      }
      isFirstRow = false;

      parsed.push({ teamId, leaderName });
    }

    return parsed;
  }

  /**
   * Generates a preview with validation status for each row in the uploaded CSV.
   * Does NOT persist anything in the database.
   */
  public static async previewTeamsUpload(userId: string, eventId: string, csvBuffer: Buffer) {
    const event = await Event.findOne({ _id: eventId, organizer: userId });
    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    const parsed = this.parseTeamsCSV(csvBuffer);
    const preview: { teamId: string; leaderName: string; status: string }[] = [];

    // Track duplicates inside the uploaded file using a Set
    const fileTeamIds = new Set<string>();
    // Cache event's existing team IDs in a Set for O(1) checks
    const existingTeamIds = new Set(event.teams.map((t) => t.teamId));

    for (const row of parsed) {
      let status = 'Valid';

      if (!row.teamId) {
        status = 'Missing Team ID';
      } else if (!row.leaderName) {
        status = 'Missing Leader Name';
      } else if (fileTeamIds.has(row.teamId)) {
        status = 'Duplicate in File';
      } else if (existingTeamIds.has(row.teamId)) {
        status = 'Duplicate in Event';
      } else {
        fileTeamIds.add(row.teamId);
      }

      preview.push({
        teamId: row.teamId,
        leaderName: row.leaderName,
        status,
      });
    }

    return preview;
  }

  /**
   * Imports valid teams into the event.
   * Returns imported count, skipped count, and list of detailed errors.
   */
  public static async importTeams(
    userId: string,
    eventId: string,
    teams: { teamId: string; leaderName: string }[]
  ) {
    const event = await Event.findOne({ _id: eventId, organizer: userId });
    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: { teamId?: string; leaderName?: string; error: string }[] = [];

    // Track duplicates inside this batch
    const batchTeamIds = new Set<string>();
    // Cache event's existing team IDs in a Set
    const existingTeamIds = new Set(event.teams.map((t) => t.teamId));

    const validTeamsToPush: any[] = [];

    for (const team of teams) {
      const teamId = team.teamId?.trim();
      const leaderName = team.leaderName?.trim();

      if (!teamId) {
        skippedCount++;
        errors.push({ error: 'Missing Team ID' });
        continue;
      }

      if (!leaderName) {
        skippedCount++;
        errors.push({ teamId, error: 'Missing Leader Name' });
        continue;
      }

      if (batchTeamIds.has(teamId)) {
        skippedCount++;
        errors.push({ teamId, leaderName, error: 'Duplicate in File' });
        continue;
      }

      if (existingTeamIds.has(teamId)) {
        skippedCount++;
        errors.push({ teamId, leaderName, error: 'Duplicate in Event' });
        continue;
      }

      // Mark as batch-verified
      batchTeamIds.add(teamId);

      validTeamsToPush.push({
        teamId,
        leaderName,
        purchased: false,
      });
      importedCount++;
    }

    if (validTeamsToPush.length > 0) {
      event.teams.push(...validTeamsToPush);
    }

    const totalRows = teams.length;
    event.latestImport = {
      importedBy: new mongoose.Types.ObjectId(userId),
      importedAt: new Date(),
      totalRows,
      successRows: importedCount,
      skippedRows: totalRows - importedCount,
    };

    await event.save();

    logger.info(`📥 Teams imported for Event ID ${eventId}: Total Rows: ${totalRows}, Successfully Imported: ${importedCount}, Skipped: ${totalRows - importedCount}`);

    return {
      importedCount,
      skippedCount,
      errors,
    };
  }

  /**
   * Retrieves the event's list of teams (paginated, with search and status filters).
   */
  public static async getTeams(
    userId: string,
    eventId: string,
    queryParams: { page?: number; limit?: number; search?: string; status?: 'all' | 'purchased' | 'remaining' }
  ) {
    const event = await Event.findOne({ _id: eventId, organizer: userId });
    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, Math.max(1, queryParams.limit || 10));
    const search = queryParams.search?.trim().toLowerCase() || '';
    const status = queryParams.status || 'all';

    let filteredTeams = event.teams || [];

    // Filter by status
    if (status === 'purchased') {
      filteredTeams = filteredTeams.filter((t) => t.purchased);
    } else if (status === 'remaining') {
      filteredTeams = filteredTeams.filter((t) => !t.purchased);
    }

    // Filter by search (Team ID or Leader Name)
    if (search) {
      filteredTeams = filteredTeams.filter(
        (t) =>
          t.teamId.toLowerCase().includes(search) ||
          t.leaderName.toLowerCase().includes(search)
      );
    }

    // Sort by teamId ascending
    filteredTeams.sort((a, b) => a.teamId.localeCompare(b.teamId));

    // Pagination
    const totalResults = filteredTeams.length;
    const totalPages = Math.ceil(totalResults / limit);
    const skip = (page - 1) * limit;
    const paginatedTeams = filteredTeams.slice(skip, skip + limit);

    // Compute stats
    const totalTeams = event.teams.length;
    const purchasedTeams = event.teams.filter((t) => t.purchased).length;
    const remainingTeams = totalTeams - purchasedTeams;

    return {
      docs: paginatedTeams,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalTeams,
        purchasedTeams,
        remainingTeams,
      },
    };
  }

  /**
   * Updates a single team's leader name.
   */
  public static async updateTeam(
    userId: string,
    eventId: string,
    teamId: string,
    leaderName: string
  ) {
    const event = await Event.findOne({ _id: eventId, organizer: userId });
    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    const team = event.teams.find((t) => t.teamId === teamId);
    if (!team) {
      throw ApiError.notFound('Team not found in this event.');
    }

    if (!leaderName || leaderName.trim().length < 2) {
      throw ApiError.badRequest('Leader name must be at least 2 characters.');
    }

    team.leaderName = leaderName.trim();
    await event.save();

    return team;
  }

  /**
   * Deletes a team from an event.
   */
  public static async deleteTeam(userId: string, eventId: string, teamId: string) {
    const event = await Event.findOne({ _id: eventId, organizer: userId });
    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    const teamIndex = event.teams.findIndex((t) => t.teamId === teamId);
    if (teamIndex === -1) {
      throw ApiError.notFound('Team not found in this event.');
    }

    // Do not allow deleting purchased teams
    if (event.teams[teamIndex].purchased) {
      throw ApiError.badRequest('Cannot delete a team that has already purchased the kit.');
    }

    event.teams.splice(teamIndex, 1);
    await event.save();
  }

  /**
   * Clears all teams (except purchased ones).
   */
  public static async clearTeams(userId: string, eventId: string) {
    const event = await Event.findOne({ _id: eventId, organizer: userId });
    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    // Keep only purchased teams
    event.teams = event.teams.filter((t) => t.purchased);
    await event.save();
  }

  /**
   * Submits an event for admin review (status → pending).
   * Validates that the event has kitProducts, price, banner, valid dates, and required info.
   */
  public static async submitForReview(userId: string, eventId: string) {
    const event = await Event.findOne({
      _id: eventId,
      organizer: userId,
    });

    if (!event) {
      throw ApiError.notFound('Event not found or you do not have access.');
    }

    if (event.status !== 'draft') {
      throw ApiError.badRequest(
        `Cannot submit an event with status '${event.status}'. Only draft events can be submitted for review.`
      );
    }

    // Move validations to submission
    if (!event.eventName || event.eventName.trim().length < 3) {
      throw ApiError.badRequest('Event name must be at least 3 characters.');
    }

    if (!event.organizationName || event.organizationName.trim().length < 2) {
      throw ApiError.badRequest('Organization name must be at least 2 characters.');
    }

    if (!event.collegeName || event.collegeName.trim().length < 3) {
      throw ApiError.badRequest('College name must be at least 3 characters.');
    }

    if (!event.description || event.description.trim().length < 10) {
      throw ApiError.badRequest('Event description must be at least 10 characters.');
    }

    if (!event.banner || !event.banner.url || !event.banner.publicId) {
      throw ApiError.badRequest('Event must have a banner image before submission.');
    }

    if (!event.startDate || !event.endDate || new Date(event.endDate) <= new Date(event.startDate)) {
      throw ApiError.badRequest('Event must have valid start and end dates (end date must be after start date).');
    }

    if (!event.eventKitPrice || event.eventKitPrice <= 0) {
      throw ApiError.badRequest('Event kit selling price must be greater than ₹0 before submission.');
    }

    if (!event.kitProducts || event.kitProducts.length === 0) {
      throw ApiError.badRequest('Event must have at least one kit product before submission.');
    }

    event.status = 'pending';
    await event.save();

    logger.info(`📝 Event submitted for admin review: Event ID ${event._id}, Name: ${event.eventName}`);

    return event;
  }

  // =========================================================================
  // Admin: Event Review (Phase 4)
  // =========================================================================

  /**
   * Retrieves all events filterable by status for admin management (paginated, sorted by newest).
   */
  public static async getAllEvents(queryParams: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, Math.max(1, queryParams.limit || 10));
    const status = queryParams.status;

    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    return executePaginatedQuery(Event, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'organizer', select: 'firstName lastName email organizerProfile' },
      ],
    });
  }

  /**
   * Retrieves details of any event for admin.
   */
  public static async getEventByIdAdmin(eventId: string) {
    const event = await Event.findById(eventId)
      .populate('organizer', 'firstName lastName email organizerProfile')
      .populate('reviewedBy', 'firstName lastName email');

    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    return event;
  }

  /**
   * Approves a submitted event (status: pending -> approved).
   */
  public static async approveEvent(eventId: string, adminUserId: string) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    if (event.status !== 'pending') {
      throw ApiError.badRequest(
        `Cannot approve an event with status '${event.status}'. Only pending events can be approved.`
      );
    }

    event.status = 'approved';
    event.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    event.reviewedAt = new Date();
    event.approvedBy = new mongoose.Types.ObjectId(adminUserId);
    event.approvedAt = new Date();
    event.rejectionReason = undefined; // Clear any old reasons

    await event.save();

    logger.info(`✅ Event APPROVED by admin: Event ID ${event._id}, Name: ${event.eventName}, Approved By: ${adminUserId}`);

    // Trigger email notification to organizer
    const populatedEvent = await event.populate<{ organizer: any }>('organizer');
    const organizerEmail = populatedEvent.organizer?.email;
    const organizerName = populatedEvent.organizer
      ? `${populatedEvent.organizer.firstName} ${populatedEvent.organizer.lastName}`
      : 'Organizer';

    if (organizerEmail) {
      EmailService.sendEventStatusNotification(
        organizerEmail,
        organizerName,
        event.eventName,
        'approved'
      ).catch((err) => logger.error('Failed to send event approval email notification:', err));
    }

    return event;
  }

  /**
   * Rejects a submitted event (status: pending -> rejected).
   */
  public static async rejectEvent(eventId: string, adminUserId: string, rejectionReason: string) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    if (event.status !== 'pending') {
      throw ApiError.badRequest(
        `Cannot reject an event with status '${event.status}'. Only pending events can be rejected.`
      );
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw ApiError.badRequest('Rejection reason must be at least 5 characters.');
    }

    event.status = 'rejected';
    event.rejectionReason = rejectionReason.trim();
    event.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    event.reviewedAt = new Date();

    await event.save();

    logger.info(`❌ Event REJECTED by admin: Event ID ${event._id}, Name: ${event.eventName}, Rejection Reason: ${rejectionReason}`);

    // Trigger email notification to organizer
    const populatedEvent = await event.populate<{ organizer: any }>('organizer');
    const organizerEmail = populatedEvent.organizer?.email;
    const organizerName = populatedEvent.organizer
      ? `${populatedEvent.organizer.firstName} ${populatedEvent.organizer.lastName}`
      : 'Organizer';

    if (organizerEmail) {
      EmailService.sendEventStatusNotification(
        organizerEmail,
        organizerName,
        event.eventName,
        'rejected',
        event.rejectionReason
      ).catch((err) => logger.error('Failed to send event rejection email notification:', err));
    }

    return event;
  }

  // =========================================================================
  // Public: Event Listing (Phase 7)
  // =========================================================================

  /**
   * Retrieves all approved events (paginated, filterable, and sortable by startDate).
   */
  public static async getPublicEvents(queryParams: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'date_asc' | 'date_desc';
  }) {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, Math.max(1, queryParams.limit || 10));
    const search = queryParams.search?.trim() || '';
    const sortBy = queryParams.sortBy || 'date_asc';

    const filter: Record<string, any> = {
      status: 'approved',
    };

    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
        { collegeName: { $regex: search, $options: 'i' } },
      ];
    }

    let sort: any = { startDate: 1 };
    if (sortBy === 'date_desc') {
      sort = { startDate: -1 };
    }

    return executePaginatedQuery(Event, filter, {
      page,
      limit,
      sort,
      select: '-teams',
    });
  }

  /**
   * Retrieves detail of an approved event by its slug.
   */
  public static async getPublicEventBySlug(slug: string) {
    const event = await Event.findOne({ slug, status: 'approved' }).select('-teams').lean();
    if (!event) {
      throw ApiError.notFound('Event not found or is currently not available.');
    }
    return event;
  }

  /**
   * Verifies a Team ID, checks if they've already purchased, and returns a secure JWT verification token.
   */
  public static async verifyTeam(eventId: string, teamId: string) {
    const event = await Event.findOne({ _id: eventId, status: 'approved' }).lean();
    if (!event) {
      throw ApiError.notFound('Event not found or is currently not available.');
    }

    const team = event.teams.find((t) => t.teamId.toUpperCase() === teamId.trim().toUpperCase());
    if (!team) {
      throw ApiError.badRequest('Team not registered for this event.');
    }

    if (team.purchased) {
      const dateStr = team.purchasedAt ? new Date(team.purchasedAt).toLocaleDateString('en-IN') : 'N/A';
      throw ApiError.badRequest(`Team has already purchased this event kit on ${dateStr}. Status: Purchased, Date: ${dateStr}`);
    }

    // Generate short-lived team verification token signed with JWT_EVENT_SECRET
    const token = jwt.sign(
      {
        eventId: event._id.toString(),
        teamId: team.teamId,
        verifiedAt: new Date().toISOString(),
      },
      env.JWT_EVENT_SECRET,
      { expiresIn: '30m' }
    );

    return {
      teamId: team.teamId,
      leaderName: team.leaderName,
      token,
    };
  }

  /**
   * Fetches metadata & price calculations for the checkout screen using the JWT token.
   */
  public static async checkoutEventKit(eventId: string, token: string, userId: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_EVENT_SECRET);
    } catch (err) {
      throw ApiError.badRequest('Invalid or expired team verification token. Please verify your team again.');
    }

    if (decoded.eventId !== eventId) {
      throw ApiError.badRequest('Verification token event ID mismatch.');
    }

    const event = await Event.findOne({ _id: eventId, status: 'approved' }).lean();
    if (!event) {
      throw ApiError.notFound('Event not available.');
    }

    const team = event.teams.find((t) => t.teamId.toUpperCase() === decoded.teamId.toUpperCase());
    if (!team) {
      throw ApiError.badRequest('Team not registered for this event.');
    }

    if (team.purchased) {
      const dateStr = team.purchasedAt ? new Date(team.purchasedAt).toLocaleDateString('en-IN') : 'N/A';
      throw ApiError.badRequest(`Team has already purchased this event kit on ${dateStr}.`);
    }

    // Pricing calculations
    const itemsPrice = event.totalKitValue;
    const discountAmount = Math.max(0, event.totalKitValue - event.eventKitPrice);
    const shippingPrice = event.eventKitPrice >= 999 ? 0 : 49;
    const totalPrice = event.eventKitPrice + shippingPrice;
    const taxPrice = Math.round(event.eventKitPrice - event.eventKitPrice / 1.18);

    return {
      event: {
        _id: event._id,
        eventName: event.eventName,
        organizationName: event.organizationName,
        collegeName: event.collegeName,
        banner: event.banner,
        endDate: event.endDate,
      },
      teamId: team.teamId,
      leaderName: team.leaderName,
      priceBreakdown: {
        itemsPrice,
        discountAmount,
        shippingPrice,
        taxPrice,
        totalPrice,
      },
      kitProducts: event.kitProducts,
    };
  }

  /**
   * Places an event kit order. Initiates Razorpay token generation or handles COD purchases.
   */
  public static async purchaseEventKit(
    eventId: string,
    token: string,
    userId: string,
    addressId: string,
    paymentMethod: 'razorpay' | 'cod'
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Verify token
      let decoded: any;
      try {
        decoded = jwt.verify(token, env.JWT_EVENT_SECRET);
      } catch (err) {
        throw ApiError.badRequest('Invalid or expired team verification token. Please verify your team again.');
      }

      if (decoded.eventId !== eventId) {
        throw ApiError.badRequest('Token event mismatch.');
      }

      // 2. Validate Event & Team
      const event = await Event.findOne({ _id: eventId, status: 'approved' }).session(session);
      if (!event) {
        throw ApiError.notFound('Event not available.');
      }

      const teamIndex = event.teams.findIndex((t) => t.teamId.toUpperCase() === decoded.teamId.toUpperCase());
      if (teamIndex === -1) {
        throw ApiError.badRequest('Team not registered for this event.');
      }
      const team = event.teams[teamIndex];
      if (team.purchased) {
        throw ApiError.badRequest(`Team has already purchased this event kit on ${new Date(team.purchasedAt!).toLocaleDateString('en-IN')}.`);
      }

      // Fetch customer email
      const customerUser = await User.findById(userId).session(session);
      const customerEmail = customerUser?.email || '';

      // 3. Find address snapshot
      const address = await Address.findOne({ _id: addressId, user: userId }).session(session);
      if (!address) {
        throw ApiError.notFound('Shipping address not found.');
      }
      const shippingAddressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India',
        email: customerEmail,
      };

      // 4. Calculate prices
      const itemsPrice = event.totalKitValue;
      const discountAmount = Math.max(0, event.totalKitValue - event.eventKitPrice);
      const shippingPrice = event.eventKitPrice >= 999 ? 0 : 49;
      const totalPrice = event.eventKitPrice + shippingPrice;
      const taxPrice = Math.round(event.eventKitPrice - event.eventKitPrice / 1.18);

      // Create mapping of kit products to order format
      const kitSnapshot = event.kitProducts.map((p) => ({
        product: new mongoose.Types.ObjectId(p.product.toString()),
        productName: p.productName,
        productSku: p.productSku,
        productImage: p.productImage || '',
        quantity: p.quantity,
        priceAtCreation: p.priceAtCreation,
      }));

      // 5. Create draft EventOrder
      const eventOrder = new EventOrder({
        event: event._id,
        organizer: event.organizer,
        customer: new mongoose.Types.ObjectId(userId),
        teamId: team.teamId,
        leaderName: team.leaderName,
        kitSnapshot,
        addressSnapshot: shippingAddressSnapshot,
        paymentMethod,
        paymentStatus: 'pending',
        deliveryStatus: 'placed',
        statusHistory: [{ status: 'placed', timestamp: new Date(), note: 'Order placed' }],
        priceBreakdown: {
          itemsPrice,
          discountAmount,
          shippingPrice,
          taxPrice,
          totalPrice,
        },
      });

      if (paymentMethod === 'cod') {
        // Direct purchase logic for Cash On Delivery (COD)
        eventOrder.paymentStatus = 'pending';
        eventOrder.deliveryStatus = 'placed';

        // Update team purchased status on the Event document
        event.teams[teamIndex].purchased = true;
        event.teams[teamIndex].purchasedAt = new Date();
        await event.save({ session });

        // Generate Invoice details
        const InvoiceSettings = mongoose.model('InvoiceSettings');
        let settings = await InvoiceSettings.findOne().session(session);
        if (!settings) {
          settings = await InvoiceSettings.create([{}], { session }).then((res) => res[0]);
        }

        // Concurrency-safe increment
        const incrementedSettings = await InvoiceSettings.findOneAndUpdate(
          {},
          { $inc: { nextInvoiceNumber: 1 } },
          { new: true, session }
        );
        const invNum = incrementedSettings ? incrementedSettings.nextInvoiceNumber : 1;
        const year = new Date().getFullYear();
        const sequence = String(invNum).padStart(6, '0');
        const invoiceId = `EV-INV-${year}-${sequence}`;

        eventOrder.invoiceId = invoiceId;
        eventOrder.invoiceUrl = `/api/v1/events/orders/${eventOrder._id}/invoice`;

        await eventOrder.save({ session });
        await session.commitTransaction();
        session.endSession();

        logger.info(`🛒 Event Kit Purchase completed via COD: Order ID ${eventOrder.orderId}, Team: ${team.teamId}, Event ID: ${eventId}`);
        logger.info(`📄 Invoice generated: Invoice ID ${invoiceId} for Order ID ${eventOrder.orderId}`);

        return {
          order: eventOrder,
          paymentRequired: false,
        };
      } else {
        // Online Razorpay Payment flow
        await eventOrder.save({ session });

        // Create Razorpay Order
        const razorpayOrder = await PaymentService.createRazorpayOrder(totalPrice, eventOrder.orderId);

        eventOrder.paymentDetails = {
          razorpayOrderId: razorpayOrder.id,
        };
        await eventOrder.save({ session });

        await session.commitTransaction();
        session.endSession();

        return {
          order: eventOrder,
          paymentRequired: true,
          razorpayOrder: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: env.RAZORPAY_KEY_ID,
          },
        };
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Confirms payment signature for online Razorpay purchases.
   */
  public static async confirmEventPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await EventOrder.findById(orderId).session(session);
      if (!order) {
        throw ApiError.notFound('Event Order not found.');
      }

      // Idempotency: If already paid, return immediately
      if (order.paymentStatus === 'paid') {
        await session.commitTransaction();
        session.endSession();
        return order;
      }

      // Verify payment signature
      const isValid = PaymentService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        logger.error(`❌ Event payment signature verification failed for Order ID ${orderId}, Razorpay Order ID: ${razorpayOrderId}`);
        throw ApiError.badRequest('Payment verification signature check failed.');
      }

      // Update payment details
      order.paymentStatus = 'paid';
      order.deliveryStatus = 'placed';
      order.paymentDetails = {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      };
      order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: 'Payment verified successfully online' });

      // Update team purchased status on the Event document
      const event = await Event.findById(order.event).session(session);
      if (event) {
        const teamIndex = event.teams.findIndex((t) => t.teamId.toUpperCase() === order.teamId.toUpperCase());
        if (teamIndex !== -1) {
          event.teams[teamIndex].purchased = true;
          event.teams[teamIndex].purchasedAt = new Date();
          await event.save({ session });
        }
      }

      // Generate invoice
      const InvoiceSettings = mongoose.model('InvoiceSettings');
      const incrementedSettings = await InvoiceSettings.findOneAndUpdate(
        {},
        { $inc: { nextInvoiceNumber: 1 } },
        { new: true, session }
      );
      const invNum = incrementedSettings ? incrementedSettings.nextInvoiceNumber : 1;
      const year = new Date().getFullYear();
      const sequence = String(invNum).padStart(6, '0');
      const invoiceId = `EV-INV-${year}-${sequence}`;

      order.invoiceId = invoiceId;
      order.invoiceUrl = `/api/v1/events/orders/${order._id}/invoice`;

      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      logger.info(`🛒 Event Kit Purchase completed via online payment: Order ID ${order.orderId}, Team: ${order.teamId}, Event ID: ${order.event}`);
      logger.info(`📄 Invoice generated: Invoice ID ${invoiceId} for Order ID ${order.orderId}`);

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves paginated event purchases list for an organizer.
   */
  public static async getOrganizerEventPurchases(
    eventId: string,
    organizerId: string,
    queryParams: { page?: number; limit?: number; search?: string; paymentStatus?: string }
  ) {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, Math.max(1, queryParams.limit || 10));
    const search = queryParams.search?.trim() || '';
    const paymentStatus = queryParams.paymentStatus?.trim() || '';

    // Security check: event must belong to this organizer
    const event = await Event.findOne({ _id: eventId, organizer: organizerId });
    if (!event) {
      throw ApiError.forbidden('You do not have access to this event purchases data.');
    }

    const filter: Record<string, any> = {
      event: new mongoose.Types.ObjectId(eventId),
    };

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { teamId: { $regex: search, $options: 'i' } },
        { leaderName: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    return executePaginatedQuery(EventOrder as any, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'customer', select: 'firstName lastName email' }],
    });
  }

  /**
   * Retrieves all event orders filterable for Admin dashboard.
   */
  public static async getAdminEventOrders(
    queryParams: {
      page?: number;
      limit?: number;
      eventId?: string;
      organizerId?: string;
      paymentStatus?: string;
      deliveryStatus?: string;
    }
  ) {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, Math.max(1, queryParams.limit || 10));

    const filter: Record<string, any> = {};

    if (queryParams.eventId) {
      filter.event = new mongoose.Types.ObjectId(queryParams.eventId);
    }
    if (queryParams.organizerId) {
      filter.organizer = new mongoose.Types.ObjectId(queryParams.organizerId);
    }
    if (queryParams.paymentStatus) {
      filter.paymentStatus = queryParams.paymentStatus;
    }
    if (queryParams.deliveryStatus) {
      filter.deliveryStatus = queryParams.deliveryStatus;
    }

    return executePaginatedQuery(EventOrder as any, filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'event', select: 'eventName' },
        { path: 'organizer', select: 'firstName lastName email' },
        { path: 'customer', select: 'firstName lastName email' },
      ],
    });
  }

  /**
   * Retrieves a customer's event order purchases.
   */
  public static async getCustomerEventOrders(userId: string) {
    return EventOrder.find({ customer: userId })
      .populate('event', 'eventName banner organizationName collegeName')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Generates a raw PDF buffer for the invoice. Reuses existing InvoiceService logic.
   */
  public static async generateEventInvoicePdf(orderId: string, userId: string, userRole: string): Promise<Buffer> {
    const order = await EventOrder.findById(orderId).lean();
    if (!order) {
      throw ApiError.notFound('Event Order not found.');
    }

    // Auth check: Admin, Organizer, or Buyer Customer
    if (
      userRole !== 'admin' &&
      order.customer.toString() !== userId.toString() &&
      order.organizer.toString() !== userId.toString()
    ) {
      throw ApiError.forbidden('You do not have permission to access this invoice.');
    }

    if (!order.invoiceId) {
      throw ApiError.badRequest('Invoice has not been generated for this purchase yet.');
    }

    const customerUser = await User.findById(order.customer).select('email');
    const customerEmail = customerUser?.email || '';

    const InvoiceSettings = mongoose.model('InvoiceSettings');
    let settings = await InvoiceSettings.findOne();
    if (!settings) {
      settings = await InvoiceSettings.create({});
    }

    // Map EventOrder to standard storefront IOrder properties to reuse InvoiceService
    const fakeOrderItems = order.kitSnapshot.map((item) => ({
      product: item.product,
      name: item.productName,
      image: item.productImage,
      slug: '',
      sku: item.productSku,
      quantity: item.quantity,
      price: item.priceAtCreation,
    }));

    const gstRate = settings.gstPercentage || 18;
    const inclusiveTotal = order.priceBreakdown.itemsPrice - order.priceBreakdown.discountAmount;
    const taxableValueTotal = Number((inclusiveTotal / (1 + gstRate / 100)).toFixed(2));
    const taxAmountTotal = Number((inclusiveTotal - taxableValueTotal).toFixed(2));
    const addr = order.addressSnapshot;
    const formattedCustomerAddress = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}${addr.landmark ? ', ' + addr.landmark : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country || 'India'}`;

    const fakeOrder: any = {
      orderId: order.orderId,
      createdAt: order.createdAt,
      items: fakeOrderItems,
      shippingAddress: {
        fullName: addr.fullName,
        phone: addr.phone,
        email: addr.email,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: addr.country,
      },
      itemsPrice: order.priceBreakdown.itemsPrice,
      discountAmount: order.priceBreakdown.discountAmount,
      shippingPrice: order.priceBreakdown.shippingPrice,
      taxPrice: order.priceBreakdown.taxPrice,
      totalPrice: order.priceBreakdown.totalPrice,
      invoiceNumber: order.invoiceId,
      invoiceSnapshot: {
        invoiceNumber: order.invoiceId,
        invoiceDate: order.createdAt,
        settingsId: settings._id.toString(),
        seller: {
          companyName: settings.companyName || 'EngineersBuy Instruments',
          gstin: settings.gstin || '29AAAAA0000A1Z5',
          address: settings.businessAddress || '102 Maker Space Hub, Science City Block, Bangalore, Karnataka - 560001',
          phone: settings.contactNumber || '+91 80 1234 5678',
          email: settings.supportEmail || 'billing@electrokart.com',
        },
        customer: {
          name: addr.fullName,
          phone: addr.phone,
          address: formattedCustomerAddress,
        },
        products: fakeOrderItems.map((i) => ({
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          price: i.price,
        })),
        taxBreakdown: {
          gstPercentage: gstRate,
          cgstPercentage: settings.cgstPercentage || gstRate / 2,
          sgstPercentage: settings.sgstPercentage || gstRate / 2,
          igstPercentage: settings.igstPercentage || gstRate,
        },
        subtotal: taxableValueTotal,
        taxAmount: taxAmountTotal,
        shippingAmount: order.priceBreakdown.shippingPrice,
        grandTotal: order.priceBreakdown.totalPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
    };

    return InvoiceService.generateInvoicePdfBuffer(fakeOrder, customerEmail, settings as any);
  }
}

export default EventService;
