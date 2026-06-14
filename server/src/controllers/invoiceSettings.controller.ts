// ============================================================================
// ElectroKart — Invoice Settings Controller
// ============================================================================
// Handles admin CRUD requests for configuring dynamic invoice properties
// and generating mock invoices for visual settings testing.
// ============================================================================

import { Request, Response } from 'express';
import { InvoiceSettings } from '../models/index.js';
import { InvoiceService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getInvoiceSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await InvoiceSettings.findOne();
  if (!settings) {
    settings = await InvoiceSettings.create({});
  }
  res.status(200).json(new ApiResponse(200, settings, 'Invoice settings retrieved successfully.'));
});

export const updateInvoiceSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await InvoiceSettings.findOne();
  if (!settings) {
    settings = new InvoiceSettings({});
  }
  
  const oldStart = settings.startingInvoiceNumber;
  Object.assign(settings, req.body);
  
  if (req.body.startingInvoiceNumber !== undefined && req.body.startingInvoiceNumber !== oldStart) {
    settings.nextInvoiceNumber = req.body.startingInvoiceNumber;
  }
  
  await settings.save();
  res.status(200).json(new ApiResponse(200, settings, 'Invoice settings updated successfully.'));
});

export const getInvoicePreview = asyncHandler(async (req: Request, res: Response) => {
  let settings = await InvoiceSettings.findOne();
  if (!settings) {
    settings = new InvoiceSettings({});
  }

  // Create mock order data for preview
  const mockOrder: any = {
    orderId: 'EK-20260614-9999',
    createdAt: new Date(),
    deliveredAt: new Date(),
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    itemsPrice: 4000,
    shippingPrice: 0,
    taxPrice: 610.17,
    discountAmount: 0,
    totalPrice: 4000,
    shippingAddress: {
      fullName: 'Jane Doe',
      phone: '+91 9988776655',
      addressLine1: '456 Tech Park Lane',
      addressLine2: 'Phase 2, Whitefield',
      landmark: 'Opposite Metro Station',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      country: 'India',
    },
    items: [
      {
        name: 'Sample Raspberry Pi 4 Model B (4GB RAM)',
        sku: 'RASP-PI4-4GB',
        quantity: 1,
        price: 3500,
      },
      {
        name: 'Sample Arduino UNO Starter Kit',
        sku: 'ARD-UNO-KIT',
        quantity: 2,
        price: 250,
      }
    ],
    invoiceNumber: `${settings.invoicePrefix || 'SC'}-${new Date().getFullYear()}-000000-PREVIEW`,
  };

  const gstRate = settings.gstPercentage || 18;
  const cgstRate = settings.cgstPercentage || 9;
  const sgstRate = settings.sgstPercentage || 9;
  const igstRate = settings.igstPercentage || 18;

  const inclusiveTotal = mockOrder.itemsPrice - mockOrder.discountAmount;
  const taxableValueTotal = Number((inclusiveTotal / (1 + gstRate / 100)).toFixed(2));
  const taxAmountTotal = Number((inclusiveTotal - taxableValueTotal).toFixed(2));

  mockOrder.invoiceSnapshot = {
    invoiceNumber: mockOrder.invoiceNumber,
    invoiceDate: new Date(),
    settingsId: settings._id.toString(),
    seller: {
      companyName: settings.companyName || 'EngineersBuy Instruments',
      gstin: settings.gstin || '29AAAAA0000A1Z5',
      address: settings.businessAddress || '102 Maker Space Hub, Science City Block, Bangalore, Karnataka - 560001',
      phone: settings.contactNumber || '+91 80 1234 5678',
      email: settings.supportEmail || 'billing@electrokart.com',
      logoUrl: settings.companyLogo || '',
      stampUrl: settings.companyStamp || '',
    },
    customer: {
      name: mockOrder.shippingAddress.fullName,
      phone: mockOrder.shippingAddress.phone,
      address: `${mockOrder.shippingAddress.addressLine1}, ${mockOrder.shippingAddress.addressLine2}, Bangalore, Karnataka - 560066`,
    },
    products: mockOrder.items.map((item: any) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
    })),
    taxBreakdown: {
      gstPercentage: gstRate,
      cgstPercentage: cgstRate,
      sgstPercentage: sgstRate,
      igstPercentage: igstRate,
    },
    subtotal: taxableValueTotal,
    taxAmount: taxAmountTotal,
    shippingAmount: mockOrder.shippingPrice,
    grandTotal: mockOrder.totalPrice,
    paymentMethod: mockOrder.paymentMethod,
    paymentStatus: mockOrder.paymentStatus,
  };

  const userEmail = 'customer@example.com';
  const pdfBuffer = await InvoiceService.generateInvoicePdfBuffer(mockOrder, userEmail, settings);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Invoice-Preview.pdf"');
  res.status(200).send(pdfBuffer);
});
