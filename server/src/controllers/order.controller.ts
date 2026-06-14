// ============================================================================
// ElectroKart — Order Controller
// ============================================================================
// Processes user checkouts, administrative list status modifications, and tracking updates.
// ============================================================================

import { Request, Response } from 'express';
import { OrderService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { shippingAddressId, paymentMethod, couponCode, customerNote, email } = req.body;
  const order = await OrderService.placeOrder(
    userId,
    shippingAddressId,
    paymentMethod,
    couponCode,
    customerNote,
    email
  );
  res.status(201).json(new ApiResponse(201, order, 'Order placed successfully.'));
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await OrderService.getUserOrders(userId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'User orders list retrieved.', result.pagination)
  );
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrders(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Admin orders list retrieved.', result.pagination)
  );
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const userRole = req.user!.role;
  const orderId = req.params.orderId || req.params.id;
  const order = await OrderService.getOrderById(orderId, userId, userRole);
  res.status(200).json(new ApiResponse(200, order, 'Order details retrieved successfully.'));
});

// Alias for administrative single order query
export const getAnyOrder = getOrderById;

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const userRole = req.user!.role;
  const orderId = req.params.orderId || req.params.id;
  const { cancellationReason } = req.body;
  const order = await OrderService.cancelOrder(
    orderId,
    userId,
    userRole,
    cancellationReason
  );
  res.status(200).json(new ApiResponse(200, order, 'Order cancelled successfully.'));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = req.user!._id;
  const orderId = req.params.orderId || req.params.id;
  const { status, note } = req.body;
  const order = await OrderService.updateOrderStatus(
    orderId,
    status,
    note,
    adminUserId
  );
  res.status(200).json(new ApiResponse(200, order, 'Order status updated successfully.'));
});

export const updateTrackingInfo = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = req.user!._id;
  const orderId = req.params.orderId || req.params.id;
  const { shippingCarrier, shippingTrackingId } = req.body;
  const order = await OrderService.updateTrackingInfo(
    orderId,
    shippingCarrier,
    shippingTrackingId,
    adminUserId
  );
  res.status(200).json(new ApiResponse(200, order, 'Tracking information updated successfully.'));
});

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const userRole = req.user!.role;
  const orderId = req.params.orderId || req.params.id;
  
  const pdfBuffer = await OrderService.generateInvoicePdf(orderId, userId, userRole);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${orderId}.pdf"`);
  res.status(200).send(pdfBuffer);
});

export const requestCancellation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const orderId = req.params.orderId || req.params.id;
  const { category, reason } = req.body;
  const order = await OrderService.requestCancellation(orderId, userId, category, reason);
  res.status(200).json(new ApiResponse(200, order, 'Cancellation request submitted successfully.'));
});

export const reviewCancellationRequest = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = req.user!._id;
  const orderId = req.params.orderId || req.params.id;
  const { action, adminResponse, internalAdminNote } = req.body;
  const order = await OrderService.reviewCancellationRequest(
    orderId,
    action,
    adminResponse,
    internalAdminNote,
    adminUserId
  );
  res.status(200).json(new ApiResponse(200, order, `Cancellation request ${action}ed successfully.`));
});

export const getCancellationRequests = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrderService.getCancellationRequests(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Cancellation requests list retrieved.', result.pagination)
  );
});

export const getPendingCancellationCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await OrderService.getPendingCancellationCount();
  res.status(200).json(new ApiResponse(200, { count }, 'Pending cancellation count retrieved.'));
});
