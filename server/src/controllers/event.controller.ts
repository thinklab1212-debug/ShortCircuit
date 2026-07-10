// ============================================================================
// Short Circuit — Event Controller
// ============================================================================
// Handles HTTP requests for Event operations.
//
// Phase 3 endpoints:
//   - POST   /organizer/events              — Create event
//   - GET    /organizer/events              — List my events
//   - GET    /organizer/events/:id          — Get event detail
//   - PATCH  /organizer/events/:id          — Update draft event
//   - DELETE /organizer/events/:id          — Delete draft event
//   - PATCH  /organizer/events/:id/submit   — Submit for review
//
// Phase 4 placeholders:
//   - POST   /organizer/events/:id/teams    — Upload teams CSV
//   - GET    /organizer/events/:id/teams    — Get teams list
//   - DELETE /organizer/events/:id/teams    — Clear teams
// ============================================================================

import { Request, Response } from 'express';
import { EventService } from '../services/index.js';
import { ApiResponse, asyncHandler, ApiError } from '../utils/index.js';

// ─── Organizer: Create Event ────────────────────────────────────────────────────

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.createEvent(req.user!._id, req.body);

  res.status(201).json(
    new ApiResponse(201, event, 'Event created successfully.')
  );
});

// ─── Organizer: List My Events ──────────────────────────────────────────────────

export const getOrganizerEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await EventService.getOrganizerEvents(req.user!._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    status: req.query.status as string | undefined,
  });

  res.status(200).json(
    ApiResponse.paginated(result.docs, result.pagination, 'Events retrieved successfully.')
  );
});

// ─── Organizer: Get Event Detail ────────────────────────────────────────────────

export const getOrganizerEventById = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.getOrganizerEventById(req.user!._id, req.params.id);

  res.status(200).json(
    new ApiResponse(200, event, 'Event retrieved successfully.')
  );
});

// ─── Organizer: Update Draft Event ──────────────────────────────────────────────

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.updateEvent(req.user!._id, req.params.id, req.body);

  res.status(200).json(
    new ApiResponse(200, event, 'Event updated successfully.')
  );
});

// ─── Organizer: Delete Draft Event ──────────────────────────────────────────────

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await EventService.deleteEvent(req.user!._id, req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, 'Event deleted successfully.')
  );
});

// ─── Organizer: Submit for Review ───────────────────────────────────────────────

export const submitForReview = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.submitForReview(req.user!._id, req.params.id);

  res.status(200).json(
    new ApiResponse(200, event, 'Event submitted for admin review.')
  );
});

// ─── Phase 4 Placeholders: Team Management ──────────────────────────────────────

// ─── Organizer: Team Management & CSV Import (Phase 5) ──────────────────────────

export const previewTeams = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json(new ApiResponse(400, null, 'Please upload a CSV file.'));
    return;
  }

  const preview = await EventService.previewTeamsUpload(
    req.user!._id,
    req.params.id,
    req.file.buffer
  );

  res.status(200).json(
    new ApiResponse(200, preview, 'CSV file parsed and validated successfully.')
  );
});

export const importTeams = asyncHandler(async (req: Request, res: Response) => {
  const { teams } = req.body;
  if (!Array.isArray(teams)) {
    res.status(400).json(new ApiResponse(400, null, 'Payload must include an array of teams.'));
    return;
  }

  const result = await EventService.importTeams(
    req.user!._id,
    req.params.id,
    teams
  );

  res.status(200).json(
    new ApiResponse(200, result, 'Teams imported successfully.')
  );
});

export const getTeams = asyncHandler(async (req: Request, res: Response) => {
  const result = await EventService.getTeams(req.user!._id, req.params.id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    status: req.query.status as any,
  });

  res.status(200).json(
    ApiResponse.paginated({ teams: result.docs, stats: result.stats }, result.pagination, 'Teams list retrieved successfully.')
  );
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const { leaderName } = req.body;
  const team = await EventService.updateTeam(
    req.user!._id,
    req.params.id,
    req.params.teamId,
    leaderName
  );

  res.status(200).json(
    new ApiResponse(200, team, 'Team leader name updated successfully.')
  );
});

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  await EventService.deleteTeam(
    req.user!._id,
    req.params.id,
    req.params.teamId
  );

  res.status(200).json(
    new ApiResponse(200, null, 'Team deleted successfully.')
  );
});

export const clearTeams = asyncHandler(async (req: Request, res: Response) => {
  await EventService.clearTeams(req.user!._id, req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, 'Teams cleared successfully.')
  );
});

// ─── Phase 4 Placeholders: Admin Event Management ───────────────────────────────

// ─── Admin Event Management & Review (Phase 6) ──────────────────────────────────

export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await EventService.getAllEvents({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    status: req.query.status as string,
  });

  res.status(200).json(
    ApiResponse.paginated(result.docs, result.pagination, 'Admin events list retrieved successfully.')
  );
});

export const getEventByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.getEventByIdAdmin(req.params.id);

  res.status(200).json(
    new ApiResponse(200, event, 'Event details retrieved successfully.')
  );
});

export const approveEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.approveEvent(req.params.id, req.user!._id);

  res.status(200).json(
    new ApiResponse(200, event, 'Event approved successfully.')
  );
});

export const rejectEvent = asyncHandler(async (req: Request, res: Response) => {
  const { rejectionReason } = req.body;
  const event = await EventService.rejectEvent(req.params.id, req.user!._id, rejectionReason);

  res.status(200).json(
    new ApiResponse(200, event, 'Event rejected successfully.')
  );
});

// ─── Public Event Listing (Phase 7) ─────────────────────────────────────────────

export const getPublicEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await EventService.getPublicEvents({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: req.query.sortBy as any,
  });

  res.status(200).json(
    ApiResponse.paginated(result.docs, result.pagination, 'Events fetched successfully.')
  );
});

export const getPublicEventBySlug = asyncHandler(async (req: Request, res: Response) => {
  const event = await EventService.getPublicEventBySlug(req.params.slug);

  res.status(200).json(
    new ApiResponse(200, event, 'Event details fetched successfully.')
  );
});

// ─── Student: Team Verification (Phase 7) ────────────────────────────────────────

export const verifyTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.body;
  const verifiedTeam = await EventService.verifyTeam(req.params.id, teamId);

  res.status(200).json(
    new ApiResponse(200, verifiedTeam, 'Team verified successfully.')
  );
});

export const purchaseEventKit = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  const { verificationToken, addressId, paymentMethod, paymentDetails, orderId } = req.body;
  const userId = req.user!._id.toString();

  if (paymentDetails && orderId) {
    // Razorpay signature validation / capture payment step
    const order = await EventService.confirmEventPayment(
      orderId,
      paymentDetails.razorpayOrderId,
      paymentDetails.razorpayPaymentId,
      paymentDetails.razorpaySignature
    );
    return res.status(200).json(new ApiResponse(200, order, 'Payment verified and purchase completed.'));
  }

  // Initial order placement step
  const result = await EventService.purchaseEventKit(
    eventId,
    verificationToken,
    userId,
    addressId,
    paymentMethod
  );

  res.status(201).json(new ApiResponse(201, result, 'Event Order placed successfully.'));
});

export const checkoutEventKit = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  const token = req.query.token as string || req.headers['x-verification-token'] as string;
  if (!token) {
    throw ApiError.badRequest('Verification token is required.');
  }

  const result = await EventService.checkoutEventKit(eventId, token, req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, result, 'Checkout details resolved successfully.'));
});

export const getOrganizerEventPurchases = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  const organizerId = req.user!._id.toString();

  const result = await EventService.getOrganizerEventPurchases(eventId, organizerId, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    paymentStatus: req.query.paymentStatus as string,
  });

  res.status(200).json(ApiResponse.paginated(result.docs, result.pagination, 'Organizer purchases fetched.'));
});

export const getAdminEventOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await EventService.getAdminEventOrders({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    eventId: req.query.eventId as string,
    organizerId: req.query.organizerId as string,
    paymentStatus: req.query.paymentStatus as string,
    deliveryStatus: req.query.deliveryStatus as string,
  });

  res.status(200).json(ApiResponse.paginated(result.docs, result.pagination, 'Admin event orders fetched.'));
});

export const getCustomerEventOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const orders = await EventService.getCustomerEventOrders(userId);

  res.status(200).json(new ApiResponse(200, orders, 'Customer event orders fetched.'));
});

export const downloadEventInvoice = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const userId = req.user!._id.toString();
  const userRole = req.user!.role;

  const pdfBuffer = await EventService.generateEventInvoicePdf(orderId, userId, userRole);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${orderId}.pdf"`);
  res.send(pdfBuffer);
});

export const updateAdminEventOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { paymentStatus, deliveryStatus } = req.body;

  const result = await EventService.updateAdminEventOrderStatus(orderId, {
    paymentStatus,
    deliveryStatus,
  });

  res.status(200).json(new ApiResponse(200, result, 'Event Order status updated successfully.'));
});
