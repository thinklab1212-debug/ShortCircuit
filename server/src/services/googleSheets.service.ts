// ============================================================================
// Short Circuit — Google Sheets Sync Service
// ============================================================================
// One-way async export of business data to a shared Google Sheets workbook.
// All methods are fire-and-forget: failures are logged but never block
// the main application flow (order placement, registration, etc.).
//
// Tabs:
//   - Orders             — Product/Project Kit orders
//   - Event Kit Orders   — Event-specific kit purchases
//   - Cancellation Requests — Customer cancellation submissions
//   - New Users          — User registrations
// ============================================================================

import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { env } from '../config/env.js';
import { logger } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Tab header definitions
// ---------------------------------------------------------------------------

const ORDER_HEADERS = [
  'Order ID', 'Date', 'Customer Name', 'Phone', 'Email', 'City', 'State',
  'Pincode', 'Items', 'Qty', 'Subtotal', 'Tax', 'Shipping', 'Discount',
  'Coupon', 'Total', 'Payment Method', 'Razorpay Payment ID', 'Status',
  'Admin Link',
];

const EVENT_ORDER_HEADERS = [
  'Order ID', 'Date', 'Event Name', 'Organizer', 'Team ID', 'Leader',
  'Customer', 'Phone', 'Email', 'City', 'Kit Items', 'Total',
  'Payment', 'Razorpay ID', 'Status', 'Admin Link',
];

const CANCELLATION_HEADERS = [
  'Order ID', 'Date Requested', 'Customer', 'Phone', 'Order Total',
  'Category', 'Reason', 'Status',
];

const NEW_USER_HEADERS = [
  'Date', 'Name', 'Email', 'Phone', 'Role',
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class GoogleSheetsService {
  private static doc: GoogleSpreadsheet | null = null;
  private static ordersSheet: GoogleSpreadsheetWorksheet | null = null;
  private static eventOrdersSheet: GoogleSpreadsheetWorksheet | null = null;
  private static cancellationsSheet: GoogleSpreadsheetWorksheet | null = null;
  private static newUsersSheet: GoogleSpreadsheetWorksheet | null = null;

  /**
   * Returns true if Google Sheets credentials are configured.
   */
  private static isConfigured(): boolean {
    return !!(env.GOOGLE_SHEETS_ID && env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY);
  }

  /**
   * Initializes the Google Sheets connection and ensures all tabs exist
   * with proper headers. Called once during server startup.
   */
  public static async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      logger.info('⏭️  Google Sheets sync disabled (no credentials configured)');
      return;
    }

    try {
      const auth = new JWT({
        email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(env.GOOGLE_SHEETS_ID!, auth);
      await this.doc.loadInfo();

      // Ensure all tabs exist with headers
      this.ordersSheet = await this.ensureSheet('Orders', ORDER_HEADERS);
      this.eventOrdersSheet = await this.ensureSheet('Event Kit Orders', EVENT_ORDER_HEADERS);
      this.cancellationsSheet = await this.ensureSheet('Cancellation Requests', CANCELLATION_HEADERS);
      this.newUsersSheet = await this.ensureSheet('New Users', NEW_USER_HEADERS);

      logger.info(`📊 Google Sheets sync connected: "${this.doc.title}" (${Object.keys(this.doc.sheetsByTitle).length} tabs)`);
    } catch (error) {
      logger.warn('⚠️  Google Sheets initialization failed (sync will be disabled):', error);
      this.doc = null;
    }
  }

  /**
   * Creates a sheet tab if it doesn't exist, or loads it if it does.
   * Sets header row on new sheets.
   */
  private static async ensureSheet(title: string, headers: string[]): Promise<GoogleSpreadsheetWorksheet | null> {
    if (!this.doc) return null;

    try {
      let sheet = this.doc.sheetsByTitle[title];
      if (!sheet) {
        sheet = await this.doc.addSheet({ title, headerValues: headers });
        logger.info(`  ✅ Created sheet tab: "${title}"`);
      }
      return sheet;
    } catch (error) {
      logger.warn(`  ⚠️  Failed to ensure sheet tab "${title}":`, error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Public append methods (fire-and-forget)
  // -------------------------------------------------------------------------

  /**
   * Appends a new order row to the Orders tab.
   */
  public static async appendOrderRow(order: any): Promise<void> {
    if (!this.ordersSheet) return;

    try {
      const addr = order.shippingAddress || {};
      const items = (order.items || []).map((i: any) => i.name).join(', ');
      const totalQty = (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const adminLink = `${env.CLIENT_URL}/admin/orders/${order._id}`;

      await this.ordersSheet.addRow({
        'Order ID': order.orderId || order._id?.toString() || '',
        'Date': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        'Customer Name': addr.fullName || '',
        'Phone': addr.phone || '',
        'Email': addr.email || '',
        'City': addr.city || '',
        'State': addr.state || '',
        'Pincode': addr.pincode || '',
        'Items': items,
        'Qty': totalQty.toString(),
        'Subtotal': `₹${order.itemsPrice || 0}`,
        'Tax': `₹${order.taxPrice || 0}`,
        'Shipping': `₹${order.shippingPrice || 0}`,
        'Discount': `₹${order.discountAmount || 0}`,
        'Coupon': order.couponCode || '—',
        'Total': `₹${order.totalPrice || 0}`,
        'Payment Method': (order.paymentMethod || '').toUpperCase(),
        'Razorpay Payment ID': order.paymentDetails?.razorpayPaymentId || '—',
        'Status': order.orderStatus || '',
        'Admin Link': adminLink,
      });

      logger.debug(`📊 Sheet sync: Order ${order.orderId} appended to Google Sheets`);
    } catch (error) {
      logger.warn(`⚠️  Sheet sync failed for order ${order.orderId}:`, error);
    }
  }

  /**
   * Appends a new event kit order row to the Event Kit Orders tab.
   */
  public static async appendEventOrderRow(eventOrder: any, event: any): Promise<void> {
    if (!this.eventOrdersSheet) return;

    try {
      const addr = eventOrder.addressSnapshot || {};
      const kitItems = (eventOrder.kitSnapshot || []).map((k: any) => `${k.productName} x${k.quantity}`).join(', ');
      const adminLink = `${env.CLIENT_URL}/admin/events/orders`;

      await this.eventOrdersSheet.addRow({
        'Order ID': eventOrder.orderId || eventOrder._id?.toString() || '',
        'Date': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        'Event Name': event?.title || event?.name || '',
        'Organizer': event?.organizerName || '',
        'Team ID': eventOrder.teamId || '',
        'Leader': eventOrder.leaderName || '',
        'Customer': addr.fullName || '',
        'Phone': addr.phone || '',
        'Email': addr.email || '',
        'City': addr.city || '',
        'Kit Items': kitItems,
        'Total': `₹${eventOrder.priceBreakdown?.totalPrice || 0}`,
        'Payment': (eventOrder.paymentMethod || '').toUpperCase(),
        'Razorpay ID': eventOrder.paymentDetails?.razorpayPaymentId || '—',
        'Status': eventOrder.deliveryStatus || '',
        'Admin Link': adminLink,
      });

      logger.debug(`📊 Sheet sync: Event Order ${eventOrder.orderId} appended to Google Sheets`);
    } catch (error) {
      logger.warn(`⚠️  Sheet sync failed for event order ${eventOrder.orderId}:`, error);
    }
  }

  /**
   * Appends a cancellation request row to the Cancellation Requests tab.
   */
  public static async appendCancellationRow(order: any): Promise<void> {
    if (!this.cancellationsSheet) return;

    try {
      const cancellation = order.cancellationRequest || {};
      const addr = order.shippingAddress || {};

      await this.cancellationsSheet.addRow({
        'Order ID': order.orderId || order._id?.toString() || '',
        'Date Requested': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        'Customer': addr.fullName || '',
        'Phone': addr.phone || '',
        'Order Total': `₹${order.totalPrice || 0}`,
        'Category': cancellation.category || '',
        'Reason': cancellation.reason || '',
        'Status': cancellation.status || 'pending',
      });

      logger.debug(`📊 Sheet sync: Cancellation for ${order.orderId} appended to Google Sheets`);
    } catch (error) {
      logger.warn(`⚠️  Sheet sync failed for cancellation ${order.orderId}:`, error);
    }
  }

  /**
   * Appends a new user registration row to the New Users tab.
   */
  public static async appendNewUserRow(user: any): Promise<void> {
    if (!this.newUsersSheet) return;

    try {
      await this.newUsersSheet.addRow({
        'Date': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        'Name': `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        'Email': user.email || '',
        'Phone': user.phone || '—',
        'Role': user.role || 'customer',
      });

      logger.debug(`📊 Sheet sync: New user ${user.email} appended to Google Sheets`);
    } catch (error) {
      logger.warn(`⚠️  Sheet sync failed for user ${user.email}:`, error);
    }
  }
}
