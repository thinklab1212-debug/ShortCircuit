// ============================================================================
// ElectroKart — Invoice Service
// ============================================================================
// Compiles order data into standard metadata shapes and formats dynamic,
// high-fidelity PDF invoices using PDFKit.
// ============================================================================

import PDFDocument from 'pdfkit';
import { IOrder } from '../models/Order.model.js';
import { IInvoiceSettings } from '../models/InvoiceSettings.model.js';
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
    phone?: string;
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

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error(`Failed to fetch image from URL: ${url}`, error);
    return null;
  }
}

export class InvoiceService {
  /**
   * Compiles complete order details into a structured invoice metadata shape.
   */
  public static compileInvoiceMetadata(order: IOrder, userEmail: string, settings: IInvoiceSettings): IInvoiceMetadata {
    logger.info(`📄 Compiling invoice metadata for order: ${order.orderId}`);

    if (order.invoiceSnapshot) {
      const snap = order.invoiceSnapshot;
      return {
        invoiceNumber: snap.invoiceNumber,
        orderId: order.orderId,
        issueDate: new Date(snap.invoiceDate).toISOString().split('T')[0],
        dueDate: new Date(snap.invoiceDate).toISOString().split('T')[0],
        buyer: {
          name: snap.customer.name,
          phone: snap.customer.phone,
          email: userEmail,
          address: snap.customer.address,
        },
        seller: {
          company: snap.seller.companyName,
          address: snap.seller.address,
          email: snap.seller.email,
          gstin: snap.seller.gstin,
          phone: snap.seller.phone,
        },
        items: snap.products.map((p) => ({
          name: p.name,
          sku: p.sku,
          qty: p.quantity,
          price: p.price,
          total: p.price * p.quantity,
        })),
        pricing: {
          subtotal: snap.subtotal,
          shipping: snap.shippingAmount,
          tax: snap.taxAmount,
          discount: order.discountAmount,
          total: snap.grandTotal,
        },
      };
    }

    // Fallback for orders without snapshots (e.g. settings previews or legacy pre-saved details)
    const issueDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const invoiceNumber = order.invoiceNumber || `INV-${new Date().getFullYear()}-000000`;
    const gstRate = settings.gstPercentage || 18;
    const itemsPriceNet = order.itemsPrice - order.discountAmount;
    const baseSubtotal = itemsPriceNet / (1 + gstRate / 100);
    const taxVal = itemsPriceNet - baseSubtotal;

    return {
      invoiceNumber,
      orderId: order.orderId,
      issueDate,
      dueDate: issueDate,
      buyer: {
        name: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        email: userEmail,
        address: `${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}${order.shippingAddress.landmark ? ', ' + order.shippingAddress.landmark : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}, ${order.shippingAddress.country || 'India'}`,
      },
      seller: {
        company: settings.companyName || 'EngineersBuy Instruments',
        address: settings.businessAddress || '102 Maker Space Hub, Science City Block, Bangalore, Karnataka - 560001',
        email: settings.supportEmail || 'billing@electrokart.com',
        gstin: settings.gstin || '29AAAAA0000A1Z5',
        phone: settings.contactNumber || '+91 80 1234 5678',
      },
      items: order.items.map((item) => ({
        name: item.name + (item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ''),
        sku: item.sku,
        qty: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      pricing: {
        subtotal: baseSubtotal,
        shipping: order.shippingPrice,
        tax: taxVal,
        discount: order.discountAmount,
        total: order.totalPrice,
      },
    };
  }

  /**
   * Generates a PDF invoice buffer.
   */
  public static async generateInvoicePdfBuffer(order: IOrder, userEmail: string, settings: IInvoiceSettings): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const metadata = this.compileInvoiceMetadata(order, userEmail, settings);
        const snap = order.invoiceSnapshot;
        
        // Create a PDFDocument
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // --- Logo Header Section ---
        let logoBuffer: Buffer | null = null;
        const logoUrl = snap ? snap.seller.logoUrl : settings.companyLogo;
        if (logoUrl) {
          logoBuffer = await fetchImageBuffer(logoUrl);
        }

        let startY = 40;
        if (logoBuffer) {
          try {
            // Draw logo at top-left
            doc.image(logoBuffer, 40, 40, { width: 100 });
            startY = 100; // Leave space below logo
          } catch (e) {
            logger.error('Failed to draw logo image on PDF, falling back to text header.', e);
          }
        }

        // Title and invoice details in the top right header (or top left if no logo)
        doc.fillColor('#111827')
           .font('Helvetica-Bold')
           .fontSize(20)
           .text('TAX INVOICE', 350, 40, { align: 'right' });

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#4b5563')
           .text(`Invoice No: ${metadata.invoiceNumber}`, 350, 65, { align: 'right' })
           .text(`Invoice Date: ${metadata.issueDate}`, 350, 78, { align: 'right' })
           .text(`Order ID: ${metadata.orderId}`, 350, 91, { align: 'right' });
        
        if (order.deliveredAt) {
          const delDate = new Date(order.deliveredAt).toISOString().split('T')[0];
          doc.text(`Delivery Date: ${delDate}`, 350, 104, { align: 'right' });
        }

        // Draw a divider line
        doc.strokeColor('#e5e7eb')
           .lineWidth(1)
           .moveTo(40, startY + 20)
           .lineTo(555, startY + 20)
           .stroke();

        let detailsY = startY + 35;

        // --- Buyer / Seller details section ---
        // Seller details (left column)
        doc.fillColor('#1f2937')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text('SOLD BY:', 40, detailsY);

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#4b5563')
           .text(metadata.seller.company, 40, detailsY + 15, { width: 220 })
           .text(metadata.seller.address, 40, detailsY + 30, { width: 220 })
           .text(`GSTIN: ${metadata.seller.gstin}`, 40, detailsY + 70)
           .text(`Email: ${metadata.seller.email}`, 40, detailsY + 83)
           .text(`Phone: ${metadata.seller.phone || ''}`, 40, detailsY + 96);

        // Buyer details (right column)
        doc.fillColor('#1f2937')
           .font('Helvetica-Bold')
           .fontSize(10)
           .text('SHIPPED TO (BILL TO):', 300, detailsY);

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#4b5563')
           .text(metadata.buyer.name, 300, detailsY + 15, { width: 250 })
           .text(metadata.buyer.address, 300, detailsY + 30, { width: 250 })
           .text(`Phone: ${metadata.buyer.phone}`, 300, detailsY + 70)
           .text(`Email: ${metadata.buyer.email}`, 300, detailsY + 83);

        // --- Product table section ---
        let tableY = detailsY + 120;

        // Table Header
        doc.rect(40, tableY, 515, 20).fill('#f3f4f6');
        doc.fillColor('#374151')
           .font('Helvetica-Bold')
           .fontSize(8)
           .text('Product Description', 45, tableY + 6)
           .text('Qty', 210, tableY + 6, { width: 30, align: 'center' })
           .text('Incl. Unit Price', 250, tableY + 6, { width: 70, align: 'right' })
           .text('Taxable Value', 330, tableY + 6, { width: 70, align: 'right' })
           .text('GST Amount', 410, tableY + 6, { width: 70, align: 'right' })
           .text('Line Total', 490, tableY + 6, { width: 60, align: 'right' });

        let currentY = tableY + 20;

        const gstRate = snap ? snap.taxBreakdown.gstPercentage : (settings.gstPercentage || 18);
        const cgstRate = snap ? snap.taxBreakdown.cgstPercentage : (settings.cgstPercentage || 9);
        const sgstRate = snap ? snap.taxBreakdown.sgstPercentage : (settings.sgstPercentage || 9);

        // Table Rows
        doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563');
        const productsList = snap ? snap.products : order.items.map((item) => ({
          name: item.name + (item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ''),
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
        }));

        const currencySymbol = settings.currencySymbol || '₹';

        let sumTaxable = 0;
        let sumGst = 0;
        let sumTotals = 0;

        const calculatedLines = productsList.map((prod) => {
          const lineTotal = prod.price * prod.quantity;
          const basePrice = prod.price / (1 + gstRate / 100);
          const taxableValue = Number((basePrice * prod.quantity).toFixed(2));
          const gstAmount = Number((lineTotal - taxableValue).toFixed(2));
          
          sumTaxable = Number((sumTaxable + taxableValue).toFixed(2));
          sumGst = Number((sumGst + gstAmount).toFixed(2));
          sumTotals = Number((sumTotals + lineTotal).toFixed(2));

          return {
            name: prod.name,
            quantity: prod.quantity,
            price: prod.price,
            lineTotal,
            taxableValue,
            gstAmount,
          };
        });

        // Apply reconciliation check
        const sumCalculated = Number((sumTaxable + sumGst).toFixed(2));
        const diff = Number((sumTotals - sumCalculated).toFixed(2));

        if (diff !== 0 && calculatedLines.length > 0) {
          const lastIndex = calculatedLines.length - 1;
          calculatedLines[lastIndex].gstAmount = Number((calculatedLines[lastIndex].gstAmount + diff).toFixed(2));
        }

        for (const line of calculatedLines) {
          // Row border line
          doc.strokeColor('#f3f4f6')
             .lineWidth(1)
             .moveTo(40, currentY + 25)
             .lineTo(555, currentY + 25)
             .stroke();

          // Render columns
          doc.text(line.name, 45, currentY + 8, { width: 160, height: 16, ellipsis: true })
             .text(line.quantity.toString(), 210, currentY + 8, { width: 30, align: 'center' })
             .text(`${currencySymbol}${line.price.toFixed(2)}`, 250, currentY + 8, { width: 70, align: 'right' })
             .text(`${currencySymbol}${line.taxableValue.toFixed(2)}`, 330, currentY + 8, { width: 70, align: 'right' })
             .text(`${currencySymbol}${line.gstAmount.toFixed(2)}`, 410, currentY + 8, { width: 70, align: 'right' })
             .text(`${currencySymbol}${line.lineTotal.toFixed(2)}`, 490, currentY + 8, { width: 60, align: 'right' });

          currentY += 25;
        }

        // --- Totals and Payment section ---
        let totalsY = currentY + 15;

        // Payment info (left column)
        doc.font('Helvetica-Bold')
           .fontSize(9.5)
           .fillColor('#1f2937')
           .text('Payment Information', 40, totalsY);

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#4b5563')
           .text(`Method: ${order.paymentMethod.toUpperCase()}`, 40, totalsY + 18)
           .text(`Status: ${order.paymentStatus.toUpperCase()}`, 40, totalsY + 31);

        // Read or Calculate totals
        const subtotalVal = metadata.pricing.subtotal;
        const taxVal = metadata.pricing.tax;
        const shippingVal = metadata.pricing.shipping;
        const grandTotalVal = metadata.pricing.total;

        const cgstVal = gstRate > 0 ? (taxVal * cgstRate) / gstRate : 0;
        const sgstVal = gstRate > 0 ? (taxVal * sgstRate) / gstRate : 0;

        // Totals column (right column)
        const renderTotalRow = (label: string, value: string, yPos: number, isBold = false) => {
          doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
             .fontSize(9)
             .fillColor(isBold ? '#111827' : '#4b5563')
             .text(label, 360, yPos, { width: 110, align: 'right' })
             .text(value, 480, yPos, { width: 70, align: 'right' });
        };

        renderTotalRow('Subtotal (excl. Tax):', `${currencySymbol}${subtotalVal.toFixed(2)}`, totalsY);
        renderTotalRow(`CGST (${cgstRate}%):`, `${currencySymbol}${cgstVal.toFixed(2)}`, totalsY + 15);
        renderTotalRow(`SGST (${sgstRate}%):`, `${currencySymbol}${sgstVal.toFixed(2)}`, totalsY + 30);
        
        if (shippingVal > 0) {
          renderTotalRow('Shipping Charges:', `${currencySymbol}${shippingVal.toFixed(2)}`, totalsY + 45);
        } else {
          renderTotalRow('Shipping Charges:', 'Free', totalsY + 45);
        }

        let nextTotalsY = totalsY + 60;

        // Grand Total box
        doc.rect(360, nextTotalsY - 4, 195, 22).fill('#e8eaff');
        renderTotalRow('Grand Total:', `${currencySymbol}${grandTotalVal.toFixed(2)}`, nextTotalsY, true);

        // --- Authorized Signatory section ---
        let signatureY = nextTotalsY + 50;

        doc.fillColor('#1f2937')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text('Authorized Signatory', 350, signatureY, { align: 'right', width: 200 });

        let stampBuffer: Buffer | null = null;
        const stampUrl = snap ? snap.seller.stampUrl : settings.companyStamp;
        if (stampUrl) {
          stampBuffer = await fetchImageBuffer(stampUrl);
        }

        if (stampBuffer) {
          try {
            // Draw stamp image (aspect ratio maintained, scaled)
            doc.image(stampBuffer, 430, signatureY + 10, { width: 80, height: 60, fit: [80, 60] });
            signatureY += 70; // leave space below stamp
          } catch (e) {
            logger.error('Failed to draw stamp image on PDF, falling back to text signatory.', e);
            signatureY += 30; // leave fallback text spacing
          }
        } else {
          signatureY += 30; // space for physical signature
        }

        doc.font('Helvetica')
           .fontSize(9.5)
           .fillColor('#4b5563')
           .text(metadata.seller.company, 350, signatureY + 5, { align: 'right', width: 200 });

        // --- Footer ---
        doc.strokeColor('#e5e7eb')
           .lineWidth(1)
           .moveTo(40, 770)
           .lineTo(555, 770)
           .stroke();

        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#9ca3af')
           .text(settings.footerMessage || 'This is a computer-generated invoice.', 40, 785, { align: 'center', width: 515 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default InvoiceService;
