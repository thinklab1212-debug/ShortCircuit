import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateManualInvoicePdf(outputPath: string): Promise<void> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 36,
    info: {
      Title: 'Tax Invoice - EB/2026/80',
      Author: 'EngineersBuy Instruments',
      Subject: 'Tax Invoice for IEEE STB MMMUT',
    },
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Register font if available, fallback to Helvetica
  const hasArial = fs.existsSync('C:/Windows/Fonts/arial.ttf');
  const hasArialBd = fs.existsSync('C:/Windows/Fonts/arialbd.ttf');
  const fontRegular = hasArial ? 'Arial' : 'Helvetica';
  const fontBold = hasArialBd ? 'Arial-Bold' : 'Helvetica-Bold';

  if (hasArial) doc.registerFont('Arial', 'C:/Windows/Fonts/arial.ttf');
  if (hasArialBd) doc.registerFont('Arial-Bold', 'C:/Windows/Fonts/arialbd.ttf');

  const curr = 'Rs. '; // Clean universal currency prefix, also works everywhere

  // --- Top Branding Bar ---
  doc.rect(36, 36, 523, 4).fill('#1e3a8a'); // Navy brand accent bar

  // --- Header: Logo & Title ---
  let headerY = 48;
  const logoPath = 'd:/ShortCircuit/client/public/logo.png';
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 36, headerY, { width: 110 });
    } catch {
      // Fallback
    }
  }

  // Invoice Title and Metadata (Right aligned)
  doc.font(fontBold).fontSize(20).fillColor('#1e3a8a').text('TAX INVOICE', 300, headerY, { width: 259, align: 'right' });

  const metaRows = [
    { label: 'Invoice No:', value: 'EB/2026/80', color: '#111827' },
    { label: 'Invoice Date:', value: '23 Sep 2026', color: '#111827' },
    { label: 'Payment Mode:', value: 'Cash (Paid)', color: '#059669' },
    { label: 'Place of Supply:', value: 'Uttar Pradesh (09)', color: '#111827' },
  ];

  let metaY = headerY + 28;
  for (const item of metaRows) {
    doc.font(fontRegular).fontSize(9).fillColor('#64748b')
       .text(item.label, 320, metaY, { width: 110, align: 'right' });
    doc.font(fontBold).fontSize(9).fillColor(item.color)
       .text(item.value, 436, metaY, { width: 123, align: 'left' });
    metaY += 14;
  }

  // Divider
  const divY1 = headerY + 84;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(36, divY1).lineTo(559, divY1).stroke();

  // --- Seller & Buyer Section ---
  const partyY = divY1 + 10;
  const colWidth = 250;

  // Box background for Buyer & Seller
  doc.roundedRect(36, partyY, 252, 95, 4).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.roundedRect(307, partyY, 252, 95, 4).fillAndStroke('#f8fafc', '#e2e8f0');

  // Sold By (Seller)
  doc.font(fontBold).fontSize(9).fillColor('#1e3a8a').text('SOLD BY (SELLER)', 46, partyY + 8);
  doc.font(fontBold).fontSize(10).fillColor('#111827').text('EngineersBuy Instruments', 46, partyY + 22);
  doc.font(fontRegular).fontSize(8.5).fillColor('#475569')
     .text('H. No. - T1, Mavi Mohalla, Tekhand Village,', 46, partyY + 36, { width: 232 })
     .text('Near DLF Prime Tower Okhla, Delhi - 110044', 46, partyY + 48, { width: 232 })
     .text('GSTIN: 07EGQPP9381B1ZU  |  State: Delhi (07)', 46, partyY + 61, { width: 232 })
     .text('Phone: +91 8920266426 | sales.shortcircuit@gmail.com', 46, partyY + 74, { width: 232 });

  // Bill To (Buyer)
  doc.font(fontBold).fontSize(9).fillColor('#1e3a8a').text('BILL TO / SHIP TO (BUYER)', 317, partyY + 8);
  doc.font(fontBold).fontSize(10).fillColor('#111827').text('IEEE STB MMMUT', 317, partyY + 22);
  doc.font(fontRegular).fontSize(8.5).fillColor('#475569')
     .text('Madan Mohan Malaviya University of Technology,', 317, partyY + 36, { width: 232 })
     .text('Gorakhpur, Uttar Pradesh - 273010', 317, partyY + 48, { width: 232 })
     .text('State Code: Uttar Pradesh (09)', 317, partyY + 61, { width: 232 })
     .text('Payment Terms: Immediate / Cash in Full', 317, partyY + 74, { width: 232 });

  // --- Items Table ---
  const tableStartY = partyY + 107;
  const tableX = 36;
  const tableW = 523;

  // Table Columns config
  // Total table width: 523
  // S.No: 30, Description: 235, HSN: 50, Qty: 40, Unit Price: 50, GST: 48, Total: 70
  // 30 + 235 + 50 + 40 + 50 + 48 + 70 = 523
  const colX = {
    sno: 36,
    desc: 66,
    hsn: 301,
    qty: 351,
    rate: 391,
    gst: 441,
    amount: 489,
    rightEdge: 559,
  };

  // Header row
  doc.rect(tableX, tableStartY, tableW, 22).fill('#1e3a8a');
  doc.font(fontBold).fontSize(8.5).fillColor('#ffffff');
  doc.text('#', colX.sno + 6, tableStartY + 6, { width: 20, align: 'center' });
  doc.text('Description of Goods / Components', colX.desc + 4, tableStartY + 6);
  doc.text('HSN', colX.hsn, tableStartY + 6, { width: 45, align: 'center' });
  doc.text('Qty', colX.qty, tableStartY + 6, { width: 35, align: 'center' });
  doc.text('Taxable', colX.rate, tableStartY + 6, { width: 45, align: 'right' });
  doc.text('GST Rate', colX.gst, tableStartY + 6, { width: 45, align: 'center' });
  doc.text('Total (INR)', colX.amount, tableStartY + 6, { width: 65, align: 'right' });

  let curY = tableStartY + 22;

  const items = [
    {
      sno: '1',
      title: 'Microcontroller Board Kit',
      description: 'Arduino Uno ×2, ESP8266 ×2, ESP32 ×2, Raspberry Pi Pico ×2, Breadboard ×5',
      hsn: '8542',
      qty: '1 Kit',
      taxable: 2500.0,
      gstRate: '18%',
      gstAmount: 450.0,
      total: 2950.0,
    },
    {
      sno: '2',
      title: 'Sensor, Modules and Bot Kit',
      description: 'Ultrasonic Sensor ×2, IR Sensor ×2, IR 8-Channel Module ×1, 12V Battery Pack ×5, Joystick Module ×2, L298N Motor Driver ×5, BMS 20A 3S ×3, MQ-2 Sensor ×2, Display Module ×2, I2C Module ×2, Rain Sensor ×1, 2-Channel Relay Module ×3, Switch ×8, DHT11 Sensor ×2, 150 RPM 12V Geared Motor ×4',
      hsn: '8080',
      qty: '1 Kit',
      taxable: 6200.0,
      gstRate: '18%',
      gstAmount: 1116.0,
      total: 7316.0,
    },
    {
      sno: '3',
      title: 'Tool Kit',
      description: 'Temperature-Controlled Soldering Iron ×2, Soldering Helping Station ×2, Glue Gun ×3, Glue Sticks ×40, 50g 60/40 Bharti Soldering Wire ×2, Tough Screwdriver Set ×2, Soldering Paste/Flux ×5, Pliers ×2, Digital Multimeter with Stand ×2, White Board ×1',
      hsn: '82060010',
      qty: '1 Kit',
      taxable: 3978.0,
      gstRate: '18%',
      gstAmount: 716.0,
      total: 4694.0,
    },
  ];

  items.forEach((item, index) => {
    const isEven = index % 2 === 1;
    // Calculate description height
    doc.font(fontRegular).fontSize(7.5);
    const descHeight = doc.heightOfString(item.description, { width: 228, lineGap: 1 });
    const rowHeight = Math.max(38, 16 + descHeight + 8);

    // Row zebra background
    if (isEven) {
      doc.rect(tableX, curY, tableW, rowHeight).fill('#f8fafc');
    }

    // Row borders
    doc.strokeColor('#e2e8f0').lineWidth(0.5);
    doc.rect(tableX, curY, tableW, rowHeight).stroke();

    // S.No
    doc.font(fontBold).fontSize(8.5).fillColor('#111827')
       .text(item.sno, colX.sno + 6, curY + 6, { width: 20, align: 'center' });

    // Item Title & Description
    doc.font(fontBold).fontSize(8.8).fillColor('#1e3a8a')
       .text(item.title, colX.desc + 4, curY + 6, { width: 228 });
    doc.font(fontRegular).fontSize(7.5).fillColor('#4b5563')
       .text(item.description, colX.desc + 4, curY + 18, { width: 228, lineGap: 1 });

    // HSN
    doc.font(fontRegular).fontSize(8.5).fillColor('#334155')
       .text(item.hsn, colX.hsn, curY + 6, { width: 45, align: 'center' });

    // Qty
    doc.font(fontRegular).fontSize(8.5).fillColor('#334155')
       .text(item.qty, colX.qty, curY + 6, { width: 35, align: 'center' });

    // Taxable
    doc.font(fontRegular).fontSize(8.5).fillColor('#334155')
       .text(item.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.rate, curY + 6, { width: 45, align: 'right' });

    // GST Rate
    doc.font(fontRegular).fontSize(8.5).fillColor('#334155')
       .text(item.gstRate, colX.gst, curY + 6, { width: 45, align: 'center' });

    // Line Total
    doc.font(fontBold).fontSize(8.5).fillColor('#111827')
       .text(item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.amount, curY + 6, { width: 65, align: 'right' });

    curY += rowHeight;
  });

  // --- Summary & Calculation Box ---
  const summaryY = curY + 10;
  const boxH = 125;

  // Left side: Words, Bank details, Terms
  const leftW = 295;
  doc.roundedRect(36, summaryY, leftW, boxH, 4).fillAndStroke('#f8fafc', '#e2e8f0');

  doc.font(fontBold).fontSize(8.5).fillColor('#1e3a8a').text('Total In Words:', 46, summaryY + 8);
  doc.font(fontBold).fontSize(8.5).fillColor('#111827')
     .text('INR Fourteen Thousand Nine Hundred Sixty Only', 46, summaryY + 20, { width: leftW - 20 });

  doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(46, summaryY + 36).lineTo(36 + leftW - 10, summaryY + 36).stroke();

  doc.font(fontBold).fontSize(8).fillColor('#1e3a8a').text('Payment & Tax Summary:', 46, summaryY + 42);
  doc.font(fontRegular).fontSize(7.5).fillColor('#475569')
     .text('• Mode: Cash payment received in full against this invoice.', 46, summaryY + 54, { width: leftW - 20 })
     .text('• Inter-State Supply: IGST @ 18% levied under GST Act.', 46, summaryY + 65, { width: leftW - 20 })
     .text('• Place of Dispatch: Delhi (07)  |  Place of Supply: UP (09)', 46, summaryY + 76, { width: leftW - 20 })
     .text('• Amount rounded off to nearest rupee as per accounting standard.', 46, summaryY + 87, { width: leftW - 20 });

  // Right side: Totals breakdown
  const rightX = 345;
  const rightW = 214;
  doc.roundedRect(rightX, summaryY, rightW, boxH, 4).fillAndStroke('#ffffff', '#cbd5e1');

  let rowY = summaryY + 8;
  const renderSummaryRow = (label: string, value: string, isBold = false, isAccent = false) => {
    doc.font(isBold ? fontBold : fontRegular).fontSize(8.5)
       .fillColor(isAccent ? '#1e3a8a' : isBold ? '#111827' : '#475569')
       .text(label, rightX + 10, rowY, { width: 110, align: 'left' })
       .text(value, rightX + 115, rowY, { width: 89, align: 'right' });
    rowY += 14;
  };

  renderSummaryRow('Total Before GST:', `${curr}12,678.00`, true);
  renderSummaryRow('IGST @ 18%:', `${curr}2,282.04`, false);
  renderSummaryRow('(CGST 9% Equiv.):', `${curr}1,141.02`, false);
  renderSummaryRow('(SGST 9% Equiv.):', `${curr}1,141.02`, false);
  renderSummaryRow('Round Off:', `(-) ${curr}0.04`, false);
  renderSummaryRow('Shipping / Delivery:', 'FREE / NIL', false);

  // Grand Total highlight box
  doc.rect(rightX + 1, rowY, rightW - 2, 22).fill('#1e3a8a');
  doc.font(fontBold).fontSize(10).fillColor('#ffffff')
     .text('Grand Total:', rightX + 10, rowY + 5, { width: 100, align: 'left' })
     .text(`${curr}14,960.00`, rightX + 105, rowY + 5, { width: 99, align: 'right' });

  // --- Signatory & Seal Section ---
  const signY = summaryY + 138;

  // Terms left
  doc.font(fontBold).fontSize(8).fillColor('#1e3a8a').text('Terms & Conditions:', 36, signY);
  doc.font(fontRegular).fontSize(7.2).fillColor('#64748b')
     .text('1. Goods once sold will not be taken back without valid authorization.', 36, signY + 12, { width: 280 })
     .text('2. Warranty applicable as per manufacturer & company warranty policy.', 36, signY + 22, { width: 280 })
     .text('3. Subject to Delhi jurisdiction only.', 36, signY + 32, { width: 280 });

  // Signatory Right
  const signBoxX = 350;
  doc.font(fontBold).fontSize(8.5).fillColor('#111827')
     .text('For EngineersBuy Instruments', signBoxX, signY, { width: 209, align: 'right' });

  // Use actual uploaded stamp/signature
  const stampPath = 'd:/ShortCircuit/server/stamp.png';
  if (fs.existsSync(stampPath)) {
    try {
      doc.image(stampPath, 460, signY + 14, { width: 85, height: 85, fit: [85, 85] });
    } catch (e) {
      console.error('Failed to draw stamp image on PDF:', e);
    }
  }

  doc.font(fontBold).fontSize(8).fillColor('#1e3a8a')
     .text('Authorized Signatory', signBoxX, signY + 102, { width: 209, align: 'right' });

  // --- Footer Bar ---
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(36, 780).lineTo(559, 780).stroke();
  doc.font(fontRegular).fontSize(7.5).fillColor('#94a3b8')
     .text('This is a computer-generated tax invoice. Registered with EngineersBuy Instruments.', 36, 787, { width: 523, align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}
