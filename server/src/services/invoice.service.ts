// ============================================================================
// ElectroKart — Invoice Service
// ============================================================================
// Manages invoice metadata formatting. In a production scenario, this service
// compiles order snapshots into PDF data buffers and uploads them to Cloudinary.
// ============================================================================

import { IOrder } from '../models/Order.model.js';
import { logger } from '../utils/index.js';

export interface IInvoiceMetadata {
  invoiceNumber: string;
  orderId: string;
  issueDate: string;
  dueDate: string;
  buyer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  seller: {
    company: string;
    address: string;
    email: string;
    gstin: string;
  };
  items: Array<{
    name: string;
    sku: string;
    qty: number;
    price: number;
    total: number;
  }>;
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
}

export class InvoiceService {
  /**
   * Compiles complete order details into a structured invoice metadata shape.
   */
  public static compileInvoiceMetadata(order: IOrder, userEmail: string): IInvoiceMetadata {
    logger.info(`📄 Compiling invoice metadata for order: ${order.orderId}`);

    const issueDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Auto-generate invoice number if it doesn't exist on order
    const invoiceNumber = order.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000000 + Math.random() * 9000000)}`;

    return {
      invoiceNumber,
      orderId: order.orderId,
      issueDate,
      dueDate: issueDate, // Due immediately for standard retail transactions
      buyer: {
        name: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        email: userEmail,
        address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + ', ' : ''}${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      },
      seller: {
        company: 'ElectroKart Technologies Pvt. Ltd.',
        address: '102 Maker Space Hub, Science City Block, Bangalore, Karnataka - 560001',
        email: 'billing@electrokart.com',
        gstin: '29AAAAA0000A1Z5', // Mock GSTIN
      },
      items: order.items.map((item) => ({
        name: item.name + (item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ''),
        sku: item.sku,
        qty: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      pricing: {
        subtotal: order.itemsPrice,
        shipping: order.shippingPrice,
        tax: order.taxPrice,
        discount: order.discountAmount,
        total: order.totalPrice,
      },
    };
  }
}

export default InvoiceService;
