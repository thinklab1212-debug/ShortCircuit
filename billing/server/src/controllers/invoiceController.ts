import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Invoice } from '../models/Invoice.js';
import { Company } from '../models/Company.js';
import { generateInvoicePdf } from '../services/pdfService.js';
import { numberToIndianWords } from '../services/numToWords.js';
import { cloudinary, isConfigured as isCloudinaryConfigured } from '../config/cloudinary.js';
import { getUploadsDir } from '../config/paths.js';

// Get next suggested invoice number
export async function getNextInvoiceNumber(req: Request, res: Response) {
  try {
    const company = await Company.findOne() || { defaultPrefix: 'EB/2026/' };
    const prefix = company.defaultPrefix || 'EB/2026/';

    // Find all invoices with this prefix to find the max counter
    const invoices = await Invoice.find({ invoiceNo: new RegExp(`^${prefix}`) }, 'invoiceNo').lean();

    let maxNum = 0;
    for (const inv of invoices) {
      const remainder = inv.invoiceNo.replace(prefix, '');
      const parsed = parseInt(remainder, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }

    const nextNum = maxNum > 0 ? maxNum + 1 : 81; // defaults smoothly to 81 if none yet
    const suggested = `${prefix}${nextNum}`;

    res.json({ suggestedInvoiceNo: suggested, nextSeq: nextNum });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to determine next invoice number' });
  }
}

// List all invoices
export async function listInvoices(req: Request, res: Response) {
  try {
    const { search, status } = req.query;
    const query: any = {};

    if (status && ['PAID', 'UNPAID', 'PARTIAL'].includes(status as string)) {
      query.paymentStatus = status;
    }

    if (search) {
      const rgx = new RegExp(String(search), 'i');
      query.$or = [
        { invoiceNo: rgx },
        { 'customer.name': rgx },
        { 'customer.companyName': rgx },
        { 'customer.phone': rgx },
      ];
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
    res.json({ invoices });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch invoices' });
  }
}

// Get single invoice
export async function getInvoiceById(req: Request, res: Response) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch invoice' });
  }
}

// Create new invoice with manual or auto invoice number
export async function createInvoice(req: Request, res: Response) {
  try {
    const company = await Company.findOne() || await Company.create({});

    let {
      invoiceNo,
      invoiceDate,
      dueDate,
      placeOfSupply,
      paymentMode,
      paymentStatus,
      paymentReference,
      customer,
      items,
      freightCharges,
      terms,
      notes,
    } = req.body;

    if (!customer || !customer.name || !customer.address) {
      return res.status(400).json({ error: 'Customer name and address are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required' });
    }

    const freight = Math.max(0, Number(freightCharges) || 0);

    // Invoice number: manual check or auto-suggest
    invoiceNo = (invoiceNo || '').trim();
    if (!invoiceNo) {
      const prefix = company.defaultPrefix || 'EB/2026/';
      const existing = await Invoice.find({ invoiceNo: new RegExp(`^${prefix}`) }, 'invoiceNo').lean();
      let maxNum = 0;
      for (const inv of existing) {
        const parsed = parseInt(inv.invoiceNo.replace(prefix, ''), 10);
        if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
      }
      invoiceNo = `${prefix}${maxNum > 0 ? maxNum + 1 : 81}`;
    }

    // Check for duplicate invoiceNo
    const duplicate = await Invoice.findOne({ invoiceNo });
    if (duplicate) {
      return res.status(400).json({ error: `Invoice number "${invoiceNo}" already exists. Please enter a different number.` });
    }

    // State code checks for GST (Intra-state CGST+SGST vs Inter-state IGST)
    const companyStateCode = (company.stateCode || '09').trim();
    const customerStateCode = (customer.stateCode || '09').trim();
    const isIntraState = companyStateCode === customerStateCode;

    let subtotal = 0;
    let totalDiscount = 0;
    let taxableSubtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const computedItems = items.map((it: any) => {
      const qty = Number(it.qty) || 1;
      const gstRate = Number(it.gstRate) !== undefined ? Number(it.gstRate) : 18;
      let unitPrice = Number(it.unitPrice) || 0;
      const inclusivePrice = Number(it.inclusivePrice) || 0;

      // If price was supplied as inclusive and unitPrice wasn't already split, back-calculate base rate
      if (it.isPriceInclusive && inclusivePrice > 0 && (!unitPrice || unitPrice === inclusivePrice)) {
        unitPrice = Math.round((inclusivePrice / (1 + (gstRate / 100))) * 100) / 100;
      }

      const discount = Number(it.discount) || 0;
      const baseVal = Math.round((qty * unitPrice) * 100) / 100;
      
      // Allow manual taxableValue override if provided, else standard calculation
      const taxableValue = (it.taxableValue !== undefined && it.taxableValue !== null && it.taxableValue !== '')
        ? Number(it.taxableValue)
        : Math.max(0, Math.round((baseVal - discount) * 100) / 100);

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (it.cgstAmount !== undefined && it.sgstAmount !== undefined && isIntraState && it.cgstAmount !== '' && it.sgstAmount !== '') {
        cgstAmount = Math.round(Number(it.cgstAmount) * 100) / 100;
        sgstAmount = Math.round(Number(it.sgstAmount) * 100) / 100;
      } else if (it.igstAmount !== undefined && !isIntraState && it.igstAmount !== '') {
        igstAmount = Math.round(Number(it.igstAmount) * 100) / 100;
      } else if (gstRate > 0) {
        if (isIntraState) {
          const halfRate = gstRate / 2;
          cgstAmount = Math.round((taxableValue * (halfRate / 100)) * 100) / 100;
          sgstAmount = Math.round((taxableValue * (halfRate / 100)) * 100) / 100;
        } else {
          igstAmount = Math.round((taxableValue * (gstRate / 100)) * 100) / 100;
        }
      }

      const total = (it.total !== undefined && it.total !== null && it.total !== '')
        ? Number(it.total)
        : Math.round((taxableValue + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

      subtotal += baseVal;
      totalDiscount += discount;
      taxableSubtotal += taxableValue;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;

      return {
        name: it.name,
        description: it.description || '',
        isKit: Boolean(it.isKit || (it.kitItems && it.kitItems.length > 0)),
        kitItems: Array.isArray(it.kitItems) ? it.kitItems : [],
        hsn: it.hsn || '',
        qty,
        unit: it.unit || (it.isKit ? 'SET' : 'NOS'),
        unitPrice,
        inclusivePrice: inclusivePrice > 0 ? inclusivePrice : undefined,
        discount,
        taxableValue,
        gstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        total,
      };
    });

    const rawGrandTotal = taxableSubtotal + cgstTotal + sgstTotal + igstTotal + freight;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Math.round((roundedGrandTotal - rawGrandTotal) * 100) / 100;
    const amountInWords = numberToIndianWords(roundedGrandTotal);

    const invoiceDateFormatted = invoiceDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // File path for PDF
    const safeInvName = invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '-');
    const storageDir = getUploadsDir('invoices');
    const pdfFilename = `Invoice-${safeInvName}.pdf`;
    const pdfLocalPath = path.join(storageDir, pdfFilename);

    const newInvoice = new Invoice({
      invoiceNo,
      invoiceDate: invoiceDateFormatted,
      dueDate: dueDate || '',
      placeOfSupply: placeOfSupply || `${customer.state || 'Uttar Pradesh'} (${customer.stateCode || '09'})`,
      paymentMode: paymentMode || 'Cash',
      paymentStatus: paymentStatus || 'PAID',
      paymentReference: paymentReference || '',
      customer: {
        customerId: customer.customerId || '',
        name: customer.name,
        companyName: customer.companyName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address,
        city: customer.city || '',
        state: customer.state || 'Uttar Pradesh',
        stateCode: customer.stateCode || '09',
        pincode: customer.pincode || '',
        gstin: customer.gstin || '',
      },
      items: computedItems,
      subtotal,
      totalDiscount,
      taxableSubtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      freightCharges: freight,
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords,
      pdfLocalPath,
      terms: terms || company.defaultTerms,
      notes: notes || '',
    });

    // Generate local PDF
    await generateInvoicePdf(newInvoice, company.toObject(), pdfLocalPath);

    // Optional Cloudinary Upload
    if (isCloudinaryConfigured) {
      try {
        const uploadResult = await cloudinary.uploader.upload(pdfLocalPath, {
          resource_type: 'raw',
          folder: process.env.CLOUDINARY_FOLDER || 'billing_invoices',
          public_id: `Invoice-${safeInvName}`,
        });
        newInvoice.pdfUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn('⚠️ Cloudinary upload skipped / failed. Local PDF available:', uploadErr);
      }
    }

    await newInvoice.save();

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: newInvoice,
      downloadUrl: `/api/invoices/${newInvoice._id}/pdf`,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
}

// Download or Stream PDF
export async function downloadInvoicePdf(req: Request, res: Response) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    let filePath = invoice.pdfLocalPath;
    if (!filePath || !fs.existsSync(filePath)) {
      // Regenerate if missing
      const company = await Company.findOne() || await Company.create({});
      const safeInvName = invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '-');
      const storageDir = getUploadsDir('invoices');
      filePath = path.join(storageDir, `Invoice-${safeInvName}.pdf`);
      await generateInvoicePdf(invoice, company.toObject(), filePath);
      invoice.pdfLocalPath = filePath;
      await invoice.save();
    }

    const safeFilename = `Invoice-${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to stream invoice PDF' });
  }
}

// Toggle or update payment status
export async function updatePaymentStatus(req: Request, res: Response) {
  try {
    const { status, paymentMode, reference } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (status) invoice.paymentStatus = status;
    if (paymentMode) invoice.paymentMode = paymentMode;
    if (reference) invoice.paymentReference = reference;

    await invoice.save();
    res.json({ message: 'Payment status updated', invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update payment status' });
  }
}

// Delete invoice
export async function deleteInvoice(req: Request, res: Response) {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.pdfLocalPath && fs.existsSync(invoice.pdfLocalPath)) {
      try {
        fs.unlinkSync(invoice.pdfLocalPath);
      } catch {
        // ignore error
      }
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete invoice' });
  }
}

// Send Invoice PDF directly via Email
export async function emailInvoice(req: Request, res: Response) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const company = await Company.findOne() || await Company.create({});
    const { to, subject, message } = req.body;

    const recipientEmail = (to || invoice.customer.email || '').trim();
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Customer email address is required to send invoice.' });
    }

    // Ensure PDF file exists
    let filePath = invoice.pdfLocalPath;
    if (!filePath || !fs.existsSync(filePath)) {
      const safeInvName = invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '-');
      const storageDir = getUploadsDir('invoices');
      filePath = path.join(storageDir, `Invoice-${safeInvName}.pdf`);
      await generateInvoicePdf(invoice, company.toObject(), filePath);
      invoice.pdfLocalPath = filePath;
      await invoice.save();
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    const safeFilename = `Invoice-${invoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured in .env. Please set RESEND_API_KEY in your server environment.' });
    }
    const senderEmail = process.env.EMAIL_FROM || 'ShortCircuit Billing <onboarding@resend.dev>';

    const emailSubject = subject || `Tax Invoice ${invoice.invoiceNo} from ${company.name || 'ShortCircuit'}`;
    const emailBody = message || `Dear ${invoice.customer.name},\n\nPlease find attached your Tax Invoice ${invoice.invoiceNo} for Rs. ${invoice.grandTotal.toFixed(2)}.\n\nThank you for choosing ${company.name || 'ShortCircuit'}!\n\nBest regards,\n${company.name || 'ShortCircuit'}\n${company.phone || ''}\n${company.email || ''}`;

    // Convert plain text newlines to clean HTML paragraphs
    const formattedHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0;">${company.name || 'ShortCircuit'}</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">${company.tagline || 'Robotics, Electronics & Innovation Lab'}</p>
        </div>
        
        <div style="white-space: pre-line; font-size: 14px;">${emailBody}</div>
        
        <div style="margin-top: 24px; padding: 14px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px;">
          <strong style="color: #1e3a8a;">Invoice Summary:</strong><br/>
          &bull; <strong>Invoice No:</strong> ${invoice.invoiceNo}<br/>
          &bull; <strong>Date:</strong> ${invoice.invoiceDate}<br/>
          &bull; <strong>Total Amount:</strong> Rs. ${invoice.grandTotal.toFixed(2)} (${invoice.paymentStatus})<br/>
          &bull; <strong>Attachment:</strong> ${safeFilename}
        </div>
        
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          This is an automated message from ${company.name || 'ShortCircuit'} Billing System.
        </p>
      </div>
    `;

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail.includes('<') ? senderEmail : `ShortCircuit <${senderEmail}>`,
        to: [recipientEmail],
        subject: emailSubject,
        html: formattedHtml,
        attachments: [
          {
            filename: safeFilename,
            content: pdfBase64,
          },
        ],
      }),
    });

    const resData: any = await response.json();

    if (!response.ok) {
      console.error('Resend error:', resData);
      return res.status(response.status).json({
        error: resData.message || 'Failed to send email via Resend',
        details: resData,
      });
    }

    // Record email timestamp
    invoice.emailedAt = new Date().toISOString();
    invoice.lastEmailedTo = recipientEmail;
    await invoice.save();

    res.json({
      success: true,
      message: `Invoice successfully emailed to ${recipientEmail}!`,
      resendId: resData.id,
    });
  } catch (error: any) {
    console.error('Email invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to email invoice' });
  }
}
