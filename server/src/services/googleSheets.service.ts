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
import Product from '../models/Product.model.js';
import ProductVariant from '../models/ProductVariant.model.js';
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

const PRODUCT_HEADERS = [
  'Product ID', 'SKU', 'Name', 'Type', 'Category', 'Brand',
  'Price / Range', 'Total Stock', 'Variant Count',
  'Select Variant (Dropdown)', 'Variant Options & Specifications',
  'Status', 'Admin Link', 'Last Updated',
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
  private static productsSheet: GoogleSpreadsheetWorksheet | null = null;

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
      // Parse private key — handle different hosting platform formats:
      // Render/Heroku may store literal \n, or wrap in extra quotes
      let privateKey = env.GOOGLE_PRIVATE_KEY!;
      // Strip surrounding quotes if present (some platforms add them)
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      // Convert literal \n to actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');

      const auth = new JWT({
        email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(env.GOOGLE_SHEETS_ID!, auth);
      await this.doc.loadInfo();

      // Ensure all tabs exist with headers and styling
      this.ordersSheet = await this.ensureSheet('Orders', ORDER_HEADERS, { red: 0.2, green: 0.66, blue: 0.33 });           // Green
      this.eventOrdersSheet = await this.ensureSheet('Event Kit Orders', EVENT_ORDER_HEADERS, { red: 0.25, green: 0.52, blue: 0.96 }); // Blue
      this.cancellationsSheet = await this.ensureSheet('Cancellation Requests', CANCELLATION_HEADERS, { red: 0.92, green: 0.26, blue: 0.21 }); // Red
      this.newUsersSheet = await this.ensureSheet('New Users', NEW_USER_HEADERS, { red: 0.61, green: 0.35, blue: 0.71 });  // Purple
      this.productsSheet = await this.ensureSheet('Products', PRODUCT_HEADERS, { red: 0.98, green: 0.73, blue: 0.01 });   // Gold/Orange

      logger.info(`📊 Google Sheets sync connected: "${this.doc.title}" (${Object.keys(this.doc.sheetsByTitle).length} tabs)`);
    } catch (error) {
      logger.warn('⚠️  Google Sheets initialization failed (sync will be disabled):', error);
      this.doc = null;
    }
  }

  /**
   * Creates a sheet tab if it doesn't exist, or loads it if it does.
   * Sets header row on new sheets and applies professional formatting.
   */
  private static async ensureSheet(
    title: string,
    headers: string[],
    tabColor?: { red: number; green: number; blue: number }
  ): Promise<GoogleSpreadsheetWorksheet | null> {
    if (!this.doc) return null;

    try {
      let sheet = this.doc.sheetsByTitle[title];
      const isNew = !sheet;

      if (!sheet) {
        sheet = await this.doc.addSheet({ title, headerValues: headers });
        logger.info(`  ✅ Created sheet tab: "${title}"`);
      }

      // Apply formatting (on new sheets or first run)
      if (isNew) {
        await this.formatSheet(sheet, headers.length, tabColor);
      }

      return sheet;
    } catch (error) {
      logger.warn(`  ⚠️  Failed to ensure sheet tab "${title}":`, error);
      return null;
    }
  }

  /**
   * Applies professional formatting to a sheet tab:
   * - Bold white header text on dark background
   * - Frozen header row
   * - Tab color coding
   * - Column widths
   */
  private static async formatSheet(
    sheet: GoogleSpreadsheetWorksheet,
    columnCount: number,
    tabColor?: { red: number; green: number; blue: number }
  ): Promise<void> {
    try {
      // Freeze header row & set tab color
      await sheet.updateProperties({
        gridProperties: { frozenRowCount: 1 } as any,
        ...(tabColor ? { tabColor } : {}),
      });

      // Load header cells and apply styling
      await sheet.loadCells({ startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount });

      for (let col = 0; col < columnCount; col++) {
        const cell = sheet.getCell(0, col);
        // Bold white text
        cell.textFormat = { bold: true, foregroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } }, fontSize: 10 };
        // Dark header background
        cell.backgroundColor = { red: 0.16, green: 0.16, blue: 0.2, alpha: 1 };
        // Center alignment
        cell.horizontalAlignment = 'CENTER';
      }

      await sheet.saveUpdatedCells();
    } catch (error) {
      // Formatting is non-critical — log and continue
      logger.debug(`  ℹ️  Could not apply formatting to "${sheet.title}":`, error);
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

  /**
   * Consolidated One-Way Export to Google Sheets (1 Row per Product; Product Families list all variants in a dropdown/details cell).
   */
  public static async syncAllProducts(): Promise<{ totalProducts: number; totalVariants: number; totalSynced: number }> {
    if (!this.productsSheet) {
      if (this.isConfigured()) {
        await this.initialize();
      }
      if (!this.productsSheet) {
        throw new Error('Google Sheets is not configured or failed to initialize credentials.');
      }
    }

    // 1. Fetch all products (populated with category & brand)
    const products = await Product.find({})
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();

    // 2. Fetch all product variants
    const variants = await ProductVariant.find({}).lean();

    // Group variants by productId
    const variantsByProductMap = new Map<string, any[]>();
    for (const v of variants) {
      const pId = v.productId?.toString();
      if (pId) {
        if (!variantsByProductMap.has(pId)) {
          variantsByProductMap.set(pId, []);
        }
        variantsByProductMap.get(pId)!.push(v);
      }
    }

    const rows: any[] = [];

    // Map each product to exactly 1 consolidated row
    for (const p of products) {
      const categoryName = (p.category as any)?.name || 'Uncategorized';
      const brandName = (p.brand as any)?.name || '—';
      const isFamily = p.productType === 'family';
      const pIdStr = p._id.toString();

      if (isFamily) {
        const familyVariants = variantsByProductMap.get(pIdStr) || [];
        const totalStock = familyVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
        const minPrice = familyVariants.length > 0 ? Math.min(...familyVariants.map((v) => v.price)) : 0;
        const maxPrice = familyVariants.length > 0 ? Math.max(...familyVariants.map((v) => v.price)) : 0;
        const priceDisplay = `₹${minPrice} – ₹${maxPrice}`;

        const dropdownDefault = familyVariants.length > 0 ? familyVariants[0].sku : 'No Variants';
        const variantsListString = familyVariants.length > 0
          ? familyVariants
              .map((v, idx) => {
                const attrStr = v.attributes
                  ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ')
                  : '';
                const priceStr = v.salePrice ? `₹${v.salePrice} (MRP ₹${v.price})` : `₹${v.price}`;
                return `${idx + 1}. [${v.sku}] ${priceStr} | Stock: ${v.stock} | (${attrStr})`;
              })
              .join('\n')
          : 'No variants configured';

        rows.push({
          'Product ID': pIdStr,
          'SKU': p.sku || '',
          'Name': p.name || '',
          'Type': 'Product Family',
          'Category': categoryName,
          'Brand': brandName,
          'Price / Range': priceDisplay,
          'Total Stock': `${totalStock} total`,
          'Variant Count': familyVariants.length.toString(),
          'Select Variant (Dropdown)': dropdownDefault,
          'Variant Options & Specifications': variantsListString,
          'Status': p.isActive ? 'Active' : 'Inactive',
          'Admin Link': `${env.CLIENT_URL}/admin/products/${p._id}/variants`,
          'Last Updated': (p as any).updatedAt ? new Date((p as any).updatedAt).toLocaleDateString('en-IN') : '—',
        });
      } else {
        rows.push({
          'Product ID': pIdStr,
          'SKU': p.sku || '',
          'Name': p.name || '',
          'Type': 'Standalone',
          'Category': categoryName,
          'Brand': brandName,
          'Price / Range': `₹${p.salePrice || p.price || 0}`,
          'Total Stock': p.stock?.toString() || '0',
          'Variant Count': '0',
          'Select Variant (Dropdown)': 'N/A (Standalone)',
          'Variant Options & Specifications': '—',
          'Status': p.isActive ? 'Active' : 'Inactive',
          'Admin Link': `${env.CLIENT_URL}/admin/products/${p._id}/edit`,
          'Last Updated': (p as any).updatedAt ? new Date((p as any).updatedAt).toLocaleDateString('en-IN') : '—',
        });
      }
    }

    // Clear existing sheet rows, set header row, and append array values
    await this.productsSheet.setHeaderRow(PRODUCT_HEADERS);
    await this.productsSheet.clearRows();

    if (rows.length > 0) {
      // Map row objects into ordered arrays matching PRODUCT_HEADERS order
      const rowArrays = rows.map((r) => PRODUCT_HEADERS.map((h) => r[h] ?? ''));
      await this.productsSheet.addRows(rowArrays);
    }

    logger.info(`📊 Google Sheets sync: Exported ${rows.length} consolidated product rows (${variants.length} total variants) to Products tab`);
    return {
      totalProducts: products.length,
      totalVariants: variants.length,
      totalSynced: rows.length,
    };
  }
}
