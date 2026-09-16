// ============================================================================
// ShortCircuit — Bulk Order Service
// ============================================================================
// Handles business logic for customer bulk quotation requests & admin workflow.
// ============================================================================

import { BulkOrderQuote, type IBulkOrderItem, type BulkOrderStatus } from '../models/index.js';
import { ApiError, logger } from '../utils/index.js';
import EmailService from './email.service.js';

export class BulkOrderService {
  /**
   * Generates a unique, human-readable quotation reference number (e.g. SC-RFQ-2609-8472).
   */
  private static generateQuoteNumber(): string {
    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SC-RFQ-${yearMonth}-${randomSuffix}`;
  }

  /**
   * Creates a new bulk quotation inquiry submitted by a customer.
   */
  static async createQuoteRequest(
    data: {
      name: string;
      email: string;
      phone: string;
      organization?: string;
      city?: string;
      pincode?: string;
      items: IBulkOrderItem[];
      notes?: string;
    },
    userId?: string
  ) {
    let quoteNumber = this.generateQuoteNumber();

    // Ensure uniqueness
    let exists = await BulkOrderQuote.findOne({ quoteNumber });
    let attempts = 0;
    while (exists && attempts < 5) {
      quoteNumber = this.generateQuoteNumber();
      exists = await BulkOrderQuote.findOne({ quoteNumber });
      attempts++;
    }

    const quote = await BulkOrderQuote.create({
      quoteNumber,
      user: userId || undefined,
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        city: data.city,
        pincode: data.pincode,
      },
      items: data.items,
      notes: data.notes,
      status: 'New',
    });

    // Notify admin via transactional email asynchronously
    EmailService.sendBulkOrderAdminNotification({
      quoteNumber: quote.quoteNumber,
      customer: quote.customer,
      items: quote.items,
      notes: quote.notes,
    }).catch((err) => {
      logger.error(`❌ Failed to send bulk order admin notification for ${quote.quoteNumber}:`, err);
    });

    return quote;
  }

  /**
   * Retrieves paginated quotes for admin dashboard with filtering and search.
   */
  static async getQuotesAdmin(query: {
    status?: string;
    search?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const filter: Record<string, any> = {};

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { quoteNumber: regex },
        { 'customer.name': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex },
        { 'customer.organization': regex },
        { 'items.productName': regex },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      BulkOrderQuote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BulkOrderQuote.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      docs: quotes,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single quotation by ID.
   */
  static async getQuoteByIdAdmin(id: string) {
    const quote = await BulkOrderQuote.findById(id);
    if (!quote) {
      throw ApiError.notFound('Bulk order quotation request not found.');
    }
    return quote;
  }

  /**
   * Updates status, admin notes, or quoted amount.
   */
  static async updateQuoteStatusAdmin(
    id: string,
    data: {
      status: BulkOrderStatus;
      adminNotes?: string;
      quotedAmount?: number;
    }
  ) {
    const updatePayload: Record<string, any> = { status: data.status };
    if (data.adminNotes !== undefined) updatePayload.adminNotes = data.adminNotes;
    if (data.quotedAmount !== undefined) updatePayload.quotedAmount = data.quotedAmount;

    const quote = await BulkOrderQuote.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!quote) {
      throw ApiError.notFound('Bulk order quotation request not found.');
    }

    return quote;
  }

  /**
   * Deletes a quotation request from admin panel.
   */
  static async deleteQuoteAdmin(id: string) {
    const quote = await BulkOrderQuote.findByIdAndDelete(id);
    if (!quote) {
      throw ApiError.notFound('Bulk order quotation request not found.');
    }
    return quote;
  }

  /**
   * Returns summary counts and statistics for admin cards.
   */
  static async getQuoteStatsAdmin() {
    const [total, newCount, underReview, quoteSent, completed, cancelled] = await Promise.all([
      BulkOrderQuote.countDocuments(),
      BulkOrderQuote.countDocuments({ status: 'New' }),
      BulkOrderQuote.countDocuments({ status: 'Under Review' }),
      BulkOrderQuote.countDocuments({ status: 'Quote Sent' }),
      BulkOrderQuote.countDocuments({ status: 'Completed' }),
      BulkOrderQuote.countDocuments({ status: 'Cancelled' }),
    ]);

    return {
      total,
      new: newCount,
      underReview,
      quoteSent,
      completed,
      cancelled,
    };
  }
}

export default BulkOrderService;
