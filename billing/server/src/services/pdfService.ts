import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IInvoice } from '../models/Invoice.js';
import { ICompany } from '../models/Company.js';
import { numberToIndianWords } from './numToWords.js';

export async function generateInvoicePdf(
  invoice: IInvoice,
  company: Partial<ICompany>,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure parent directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      info: {
        Title: `Tax Invoice - ${invoice.invoiceNo}`,
        Author: company.name || 'EngineersBuy Instruments',
        Subject: `Tax Invoice for ${invoice.customer.name}`,
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Font selection
    const hasArial = fs.existsSync('C:/Windows/Fonts/arial.ttf');
    const hasArialBd = fs.existsSync('C:/Windows/Fonts/arialbd.ttf');
    const fontRegular = hasArial ? 'Arial' : 'Helvetica';
    const fontBold = hasArialBd ? 'Arial-Bold' : 'Helvetica-Bold';

    if (hasArial) doc.registerFont('Arial', 'C:/Windows/Fonts/arial.ttf');
    if (hasArialBd) doc.registerFont('Arial-Bold', 'C:/Windows/Fonts/arialbd.ttf');

    const curr = 'Rs. ';

    // Top branding accent line
    doc.rect(36, 36, 523, 4).fill('#1e3a8a');

    // Header section
    let headerY = 48;
    const logoCandidates = [
      company.logoPath,
      path.resolve(process.cwd(), 'assets/logo.png'),
      'd:/ShortCircuit/billing/client/public/logo.png',
      'd:/ShortCircuit/client/public/logo.png',
    ].filter(Boolean) as string[];

    let logoDrawn = false;
    for (const p of logoCandidates) {
      if (p && fs.existsSync(p)) {
        try {
          doc.image(p, 36, headerY, { width: 110 });
          logoDrawn = true;
          break;
        } catch {
          // ignore error
        }
      }
    }

    if (!logoDrawn) {
      doc.font(fontBold).fontSize(16).fillColor('#1e3a8a').text(company.name || 'SHORTCIRCUIT', 36, headerY + 4);
    }

    // Title and Meta on the right
    doc.font(fontBold).fontSize(20).fillColor('#1e3a8a').text('TAX INVOICE', 300, headerY, { width: 259, align: 'right' });

    const isPaid = (invoice.paymentStatus || 'PAID').toUpperCase() === 'PAID';
    const statusColor = isPaid ? '#059669' : '#dc2626';
    const metaRows = [
      { label: 'Invoice No:', value: invoice.invoiceNo, color: '#111827' },
      { label: 'Invoice Date:', value: invoice.invoiceDate, color: '#111827' },
      { label: 'Payment Mode:', value: `${invoice.paymentMode || 'Cash'} (${invoice.paymentStatus || 'PAID'})`, color: statusColor },
      { label: 'Place of Supply:', value: invoice.placeOfSupply || 'Uttar Pradesh (09)', color: '#111827' },
    ];

    let metaY = headerY + 28;
    for (const item of metaRows) {
      doc.font(fontRegular).fontSize(9).fillColor('#64748b').text(item.label, 320, metaY, { width: 110, align: 'right' });
      doc.font(fontBold).fontSize(9).fillColor(item.color).text(item.value, 436, metaY, { width: 123, align: 'left' });
      metaY += 14;
    }

    // Divider
    let currentY = Math.max(headerY + 70, metaY + 8);
    doc.moveTo(36, currentY).lineTo(559, currentY).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
    currentY += 12;

    // Billed By & Billed To Boxes
    const boxW = 254;
    const boxH = 96;

    // Company Box (Left)
    doc.roundedRect(36, currentY, boxW, boxH, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(36, currentY, 3, boxH).fill('#1e3a8a');
    doc.font(fontBold).fontSize(8).fillColor('#1e3a8a').text('BILLED BY (SUPPLIER)', 46, currentY + 7);
    doc.font(fontBold).fontSize(9.5).fillColor('#111827').text(company.name || 'EngineersBuy Instruments', 46, currentY + 20, { width: boxW - 20 });
    doc.font(fontRegular).fontSize(7.5).fillColor('#475569')
      .text(company.address || 'Shop No. 12, Electronics Market', 46, currentY + 34, { width: boxW - 20, lineGap: 1 })
      .text(`Phone: ${company.phone || '+91 98765 43210'} | Email: ${company.email || 'sales@engineersbuy.com'}`, 46, currentY + 62, { width: boxW - 20 })
      .font(fontBold).fillColor('#1e3a8a')
      .text(`GSTIN: ${company.gstin || '09AAACE1234F1Z5'}  |  PAN: ${company.pan || 'AAACE1234F'}`, 46, currentY + 78, { width: boxW - 20 });

    // Customer Box (Right)
    const custX = 305;
    doc.roundedRect(custX, currentY, boxW, boxH, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(custX, currentY, 3, boxH).fill('#059669');
    doc.font(fontBold).fontSize(8).fillColor('#059669').text('BILLED TO (CUSTOMER)', custX + 10, currentY + 7);

    let custTextY = currentY + 20;
    doc.font(fontBold).fontSize(9.5).fillColor('#111827').text(invoice.customer.name, custX + 10, custTextY, { width: boxW - 20, lineBreak: false });
    custTextY += 12;

    if (invoice.customer.companyName) {
      doc.font(fontBold).fontSize(8).fillColor('#1e3a8a').text(invoice.customer.companyName, custX + 10, custTextY, { width: boxW - 20, lineBreak: false });
      custTextY += 11;
    }

    doc.font(fontRegular).fontSize(7.5).fillColor('#475569')
      .text(invoice.customer.address, custX + 10, custTextY, { width: boxW - 20, lineGap: 1 });

    if (invoice.customer.phone || invoice.customer.email) {
      const contactStr = [invoice.customer.phone && `Ph: ${invoice.customer.phone}`, invoice.customer.email].filter(Boolean).join(' | ');
      doc.text(contactStr, custX + 10, currentY + 62, { width: boxW - 20 });
    }

    const custGstin = invoice.customer.gstin ? `GSTIN: ${invoice.customer.gstin}` : 'GSTIN: Unregistered / Consumer';
    const stateStr = `State: ${invoice.customer.state || 'Uttar Pradesh'} (${invoice.customer.stateCode || '09'})`;
    doc.font(fontBold).fillColor('#111827').text(`${custGstin}  |  ${stateStr}`, custX + 10, currentY + 78, { width: boxW - 20 });

    currentY += boxH + 14;

    // Items Table
    const tableTop = currentY;
    const colX = { num: 36, desc: 60, hsn: 270, qty: 320, rate: 360, taxVal: 425, total: 490 };
    const colW = { num: 24, desc: 206, hsn: 48, qty: 38, rate: 62, taxVal: 62, total: 69 };

    // Table Header
    doc.rect(36, tableTop, 523, 20).fill('#1e3a8a');
    doc.font(fontBold).fontSize(8).fillColor('#ffffff')
      .text('#', colX.num, tableTop + 6, { width: colW.num, align: 'center' })
      .text('ITEM DESCRIPTION', colX.desc, tableTop + 6, { width: colW.desc, align: 'left' })
      .text('HSN/SAC', colX.hsn, tableTop + 6, { width: colW.hsn, align: 'center' })
      .text('QTY', colX.qty, tableTop + 6, { width: colW.qty, align: 'center' })
      .text('RATE (Rs.)', colX.rate, tableTop + 6, { width: colW.rate, align: 'right' })
      .text('TAXABLE', colX.taxVal, tableTop + 6, { width: colW.taxVal, align: 'right' })
      .text('TOTAL (Rs.)', colX.total, tableTop + 6, { width: colW.total, align: 'right' });

    let rowY = tableTop + 20;

    invoice.items.forEach((item, index) => {
      const isEven = index % 2 === 0;

      // Extract kit items if present
      const kitList = (item.kitItems && item.kitItems.length > 0)
        ? item.kitItems
        : (item.description && item.description.includes('\n'))
          ? item.description.split('\n').map(s => s.trim()).filter(Boolean)
          : [];

      const hasKitBreakdown = kitList.length > 0;
      let kitTextHeight = 0;
      if (hasKitBreakdown) {
        kitTextHeight = kitList.length * 10 + 10;
      } else if (item.description) {
        kitTextHeight = 11;
      }

      const rowHeight = Math.max(22, 16 + kitTextHeight);

      if (isEven) {
        doc.rect(36, rowY, 523, rowHeight).fill('#ffffff');
      } else {
        doc.rect(36, rowY, 523, rowHeight).fill('#f8fafc');
      }

      doc.moveTo(36, rowY + rowHeight).lineTo(559, rowY + rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      doc.font(fontRegular).fontSize(8.5).fillColor('#64748b')
        .text(String(index + 1), colX.num, rowY + 6, { width: colW.num, align: 'center' });

      // Item description + Kit components list
      let descY = rowY + 6;
      doc.font(fontBold).fontSize(8.5).fillColor('#111827')
        .text(item.name, colX.desc, descY, { width: colW.desc, align: 'left', lineBreak: false });

      if (hasKitBreakdown) {
        descY += 12;
        doc.font(fontBold).fontSize(6.8).fillColor('#1e3a8a')
           .text('Package / Kit Breakdown:', colX.desc + 2, descY);
        descY += 9;

        kitList.forEach((kitSubItem) => {
          const cleanItem = kitSubItem.replace(/^[•\-\*]\s*/, '').trim();
          doc.font(fontRegular).fontSize(6.8).fillColor('#475569')
             .text(`• ${cleanItem}`, colX.desc + 6, descY, { width: colW.desc - 10, lineGap: 0.5 });
          descY += 9.5;
        });
      } else if (item.description) {
        doc.font(fontRegular).fontSize(7).fillColor('#64748b')
           .text(item.description, colX.desc, descY + 11, { width: colW.desc, lineBreak: false });
      }

      doc.font(fontRegular).fontSize(8).fillColor('#64748b')
        .text(item.hsn || '-', colX.hsn, rowY + 6, { width: colW.hsn, align: 'center' });

      doc.font(fontBold).fontSize(8.5).fillColor('#111827')
        .text(`${item.qty} ${item.unit || (hasKitBreakdown ? 'SET' : 'NOS')}`, colX.qty, rowY + 6, { width: colW.qty, align: 'center' });

      doc.font(fontRegular).fontSize(8.5).fillColor('#111827')
        .text(item.unitPrice.toFixed(2), colX.rate, rowY + 6, { width: colW.rate, align: 'right' });

      doc.font(fontRegular).fontSize(8.5).fillColor('#111827')
        .text(item.taxableValue.toFixed(2), colX.taxVal, rowY + 6, { width: colW.taxVal, align: 'right' });

      doc.font(fontBold).fontSize(8.5).fillColor('#1e3a8a')
        .text(item.total.toFixed(2), colX.total, rowY + 6, { width: colW.total, align: 'right' });

      rowY += rowHeight;
    });

    // Total quantity calculation
    const totalQty = invoice.items.reduce((s, it) => s + it.qty, 0);

    // Table Subtotal Summary Row
    doc.rect(36, rowY, 523, 20).fill('#edf2f7');
    doc.moveTo(36, rowY + 20).lineTo(559, rowY + 20).strokeColor('#cbd5e1').lineWidth(0.8).stroke();

    doc.font(fontBold).fontSize(8.5).fillColor('#1e3a8a')
      .text('TOTAL QUANTITY / TAXABLE VALUE', colX.desc, rowY + 5, { width: 200, align: 'left' })
      .text(`${totalQty} Items`, colX.qty, rowY + 5, { width: colW.qty, align: 'center' })
      .text(`${curr}${invoice.taxableSubtotal.toFixed(2)}`, colX.taxVal, rowY + 5, { width: colW.taxVal, align: 'right' })
      .text(`${curr}${invoice.grandTotal.toFixed(2)}`, colX.total, rowY + 5, { width: colW.total, align: 'right' });

    currentY = rowY + 28;

    // Bottom Split: Left Side (Bank & Terms) vs Right Side (Tax & Financial Summary)
    const leftW = 280;
    const rightW = 233;
    const rightX = 326;

    // Bank Details Card (Left)
    const bankH = 82;
    doc.roundedRect(36, currentY, leftW, bankH, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(36, currentY, 3, bankH).fill('#1e3a8a');
    doc.font(fontBold).fontSize(8).fillColor('#1e3a8a').text('BANK & PAYMENT DETAILS', 46, currentY + 6);

    const bankRows = [
      { label: 'Bank Name:', val: company.bankName || 'State Bank of India' },
      { label: 'Account No:', val: company.accountNo || '39485720194' },
      { label: 'IFSC Code:', val: company.ifsc || 'SBIN0001234' },
      { label: 'Branch:', val: company.branch || 'MMMUT Branch, Gorakhpur' },
      { label: 'UPI ID:', val: company.upiId || 'engineersbuy@sbi' },
    ];

    let bY = currentY + 18;
    for (const br of bankRows) {
      doc.font(fontRegular).fontSize(7.5).fillColor('#64748b').text(br.label, 46, bY, { width: 75 });
      doc.font(fontBold).fontSize(7.5).fillColor('#111827').text(br.val, 122, bY, { width: leftW - 90 });
      bY += 12;
    }

    // Terms & Conditions (Left below bank)
    const termsH = 68;
    const termsY = currentY + bankH + 8;
    doc.roundedRect(36, termsY, leftW, termsH, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(36, termsY, 3, termsH).fill('#64748b');
    doc.font(fontBold).fontSize(8).fillColor('#475569').text('TERMS & CONDITIONS', 46, termsY + 6);

    const termsList = invoice.terms && invoice.terms.length > 0
      ? invoice.terms
      : (company.defaultTerms || [
        'Warranty as per manufacturer terms.',
        'Goods once sold will not be taken back.',
        'Subject to Gorakhpur jurisdiction only.',
      ]);

    let tY = termsY + 18;
    termsList.slice(0, 3).forEach((term, i) => {
      doc.font(fontRegular).fontSize(7).fillColor('#64748b').text(`${i + 1}. ${term}`, 46, tY, { width: leftW - 20, lineGap: 1 });
      tY += 14;
    });

    // Right Side: Tax & Total Financial Summary Table
    const summaryRows: { label: string; value: string; isBold?: boolean; isHighlight?: boolean }[] = [
      { label: 'Taxable Subtotal', value: `${curr}${invoice.taxableSubtotal.toFixed(2)}` },
    ];

    if (invoice.totalDiscount > 0) {
      summaryRows.push({ label: 'Discount', value: `-${curr}${invoice.totalDiscount.toFixed(2)}` });
    }

    if (invoice.cgstTotal > 0 || invoice.sgstTotal > 0) {
      summaryRows.push({ label: 'CGST (Central Tax)', value: `${curr}${invoice.cgstTotal.toFixed(2)}` });
      summaryRows.push({ label: 'SGST (State Tax)', value: `${curr}${invoice.sgstTotal.toFixed(2)}` });
    } else if (invoice.igstTotal > 0) {
      summaryRows.push({ label: 'IGST (Integrated Tax)', value: `${curr}${invoice.igstTotal.toFixed(2)}` });
    }

    if (invoice.roundOff !== 0) {
      summaryRows.push({ label: 'Round Off', value: `${curr}${invoice.roundOff >= 0 ? '+' : ''}${invoice.roundOff.toFixed(2)}` });
    }

    let sY = currentY;
    summaryRows.forEach((row, i) => {
      doc.rect(rightX, sY, rightW, 16).fill(i % 2 === 0 ? '#ffffff' : '#f8fafc');
      doc.moveTo(rightX, sY + 16).lineTo(rightX + rightW, sY + 16).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.font(fontRegular).fontSize(8).fillColor('#64748b').text(row.label, rightX + 8, sY + 4, { width: 120 });
      doc.font(fontBold).fontSize(8).fillColor('#111827').text(row.value, rightX + 130, sY + 4, { width: 95, align: 'right' });
      sY += 16;
    });

    // Grand Total Box (Prominent)
    doc.rect(rightX, sY + 4, rightW, 26).fill('#1e3a8a');
    doc.font(fontBold).fontSize(10).fillColor('#ffffff')
      .text('GRAND TOTAL', rightX + 8, sY + 11)
      .text(`${curr}${invoice.grandTotal.toFixed(2)}`, rightX + 100, sY + 11, { width: 125, align: 'right' });

    // Amount in Words below right summary
    const wordsY = sY + 36;
    const words = invoice.amountInWords || numberToIndianWords(invoice.grandTotal);
    doc.roundedRect(rightX, wordsY, rightW, 40, 3).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.font(fontBold).fontSize(7.5).fillColor('#1e3a8a').text('AMOUNT IN WORDS:', rightX + 6, wordsY + 5);
    doc.font(fontRegular).fontSize(7.5).fillColor('#1e40af').text(words, rightX + 6, wordsY + 15, { width: rightW - 12 });

    // Authorized Signatory Block
    const signY = termsY + termsH + 10;
    const signBoxH = 58;
    doc.roundedRect(36, signY, 523, signBoxH, 4).strokeColor('#e2e8f0').lineWidth(0.8).stroke();
    doc.font(fontRegular).fontSize(7.5).fillColor('#64748b')
      .text('Certified that the particulars given above are true and correct.', 46, signY + 10);

    const signRightX = 350;
    doc.font(fontBold).fontSize(8.5).fillColor('#1e3a8a')
      .text(`For ${company.name || 'ShortCircuit'}`, signRightX, signY + 7, { width: 200, align: 'right' });

    // Render authorized stamp / signature image
    const stampCandidates = [
      path.resolve(process.cwd(), 'assets/stamp.png'),
      'd:/ShortCircuit/billing/server/assets/stamp.png',
      'd:/ShortCircuit/server/stamp.png',
      'd:/ShortCircuit/client/public/stamp.png',
    ];

    let stampDrawn = false;
    for (const sPath of stampCandidates) {
      if (fs.existsSync(sPath)) {
        try {
          doc.image(sPath, 480, signY + 17, { fit: [65, 30] });
          stampDrawn = true;
          break;
        } catch (e) {
          // ignore error
        }
      }
    }

    doc.font(fontBold).fontSize(7.5).fillColor('#1e3a8a')
      .text('Authorized Signatory', signRightX, signY + 45, { width: 200, align: 'right' });

    // Bottom Footer Bar
    doc.rect(36, 788, 523, 2).fill('#1e3a8a');
    doc.font(fontRegular).fontSize(7.5).fillColor('#94a3b8')
      .text(`This is a computer generated tax invoice. Registered with ${company.name || 'ShortCircuit'}.`, 36, 794, { align: 'center', width: 523 });

    doc.end();

    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', (err) => reject(err));
  });
}
