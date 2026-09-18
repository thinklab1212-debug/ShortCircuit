// ============================================================================
// ShortCircuit — Bulk Order Controller
// ============================================================================
// Handles incoming customer RFQ submissions and admin quotation management.
// ============================================================================

import { Request, Response } from 'express';
import { BulkOrderService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export class BulkOrderController {
  /**
   * Public: submit a bulk order quote inquiry
   */
  static createQuoteRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id?.toString();
    const quote = await BulkOrderService.createQuoteRequest(req.body, userId);

    res.status(201).json(
      new ApiResponse(
        201,
        quote,
        'Your bulk quotation request has been submitted successfully. Our team will review your requirements and email you the official quotation.'
      )
    );
  });

  /**
   * Protected: get all bulk order inquiries for the logged-in customer
   */
  static getMyBulkOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id?.toString();
    const email = (req as any).user?.email;
    const quotes = await BulkOrderService.getMyBulkOrders(userId, email);
    res.status(200).json(new ApiResponse(200, quotes, 'Your bulk orders retrieved successfully.'));
  });

  /**
   * Admin: get all bulk orders (with filter & pagination)
   */
  static getQuotesAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await BulkOrderService.getQuotesAdmin(req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result.docs, 'Bulk quotations fetched successfully.', result.pagination));
  });

  /**
   * Admin: get quotation metrics / stats
   */
  static getQuoteStatsAdmin = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await BulkOrderService.getQuoteStatsAdmin();
    res.status(200).json(new ApiResponse(200, stats, 'Bulk quotation statistics fetched successfully.'));
  });

  /**
   * Admin: get single quote by ID
   */
  static getQuoteByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
    const quote = await BulkOrderService.getQuoteByIdAdmin(req.params.id);
    res.status(200).json(new ApiResponse(200, quote, 'Bulk quotation retrieved successfully.'));
  });

  /**
   * Admin: update quotation status & notes
   */
  static updateQuoteStatusAdmin = asyncHandler(async (req: Request, res: Response) => {
    const quote = await BulkOrderService.updateQuoteStatusAdmin(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, quote, 'Bulk quotation status updated successfully.'));
  });

  /**
   * Admin: delete quotation
   */
  static deleteQuoteAdmin = asyncHandler(async (req: Request, res: Response) => {
    await BulkOrderService.deleteQuoteAdmin(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Bulk quotation deleted successfully.'));
  });
}

export default BulkOrderController;
