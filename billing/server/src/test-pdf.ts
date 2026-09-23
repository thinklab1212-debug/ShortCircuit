import path from 'path';
import fs from 'fs';
import { generateInvoicePdf } from './services/pdfService.js';
import { IInvoice } from './models/Invoice.js';

async function testPdf() {
  const dummyInvoice: any = {
    invoiceNo: 'EB/2026/81',
    invoiceDate: '23 Sep 2026',
    dueDate: '30 Sep 2026',
    placeOfSupply: 'Uttar Pradesh (09)',
    paymentMode: 'Cash',
    paymentStatus: 'PAID',
    customer: {
      name: 'IEEE STB MMMUT',
      companyName: 'Madan Mohan Malaviya Univ. of Technology',
      address: 'Deoria Road, Singhariya, Gorakhpur, UP - 273010',
      state: 'Uttar Pradesh',
      stateCode: '09',
      gstin: '09AAACE1234F1Z5',
      phone: '+91 94500 00000',
      email: 'ieee@mmmut.ac.in',
    },
    items: [
      {
        name: 'Arduino Uno R3 Compatible Board (SMD)',
        hsn: '8542',
        qty: 10,
        unit: 'NOS',
        unitPrice: 450,
        discount: 0,
        taxableValue: 4500,
        gstRate: 18,
        cgstAmount: 405,
        sgstAmount: 405,
        igstAmount: 0,
        total: 5310,
      },
      {
        name: 'Digital Storage Oscilloscope 100MHz 2CH',
        hsn: '9030',
        qty: 1,
        unit: 'NOS',
        unitPrice: 22000,
        discount: 1000,
        taxableValue: 21000,
        gstRate: 18,
        cgstAmount: 1890,
        sgstAmount: 1890,
        igstAmount: 0,
        total: 24780,
      },
      {
        name: 'Custom IoT & Robotics Workshop Kit',
        isKit: true,
        kitItems: [
          '1x Arduino Uno R3 DIP Microcontroller',
          '1x NodeMCU ESP8266 Wi-Fi Development Board',
          '1x 16x2 I2C Blue Backlight LCD Display',
          '1x HC-SR04 Ultrasonic Distance Sensor',
          '1x SG90 Micro Servo Motor 9g',
          '1x 830-Point Solderless Breadboard & 65-pc Jumpers',
        ],
        hsn: '8542',
        qty: 5,
        unit: 'SET',
        unitPrice: 2400,
        discount: 0,
        taxableValue: 12000,
        gstRate: 18,
        cgstAmount: 1080,
        sgstAmount: 1080,
        igstAmount: 0,
        total: 14160,
      }
    ],
    subtotal: 38500,
    totalDiscount: 1000,
    taxableSubtotal: 37500,
    cgstTotal: 3375,
    sgstTotal: 3375,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 44250,
    amountInWords: 'Rupees Forty-Four Thousand Two Hundred Fifty Only',
    terms: [
      'Warranty as per manufacturer terms and conditions.',
      'Goods once sold will not be taken back or exchanged.',
      'Subject to Gorakhpur jurisdiction only.',
    ]
  };

  const company: any = {
    name: 'ShortCircuit',
    address: 'Shop No. 12, Ground Floor, Electronics Market, Gorakhpur, UP - 273010',
    phone: '+91 98765 43210',
    email: 'sales@shortcircuit.in',
    gstin: '09AAACE1234F1Z5',
    pan: 'AAACE1234F',
    bankName: 'State Bank of India',
    accountNo: '39485720194',
    ifsc: 'SBIN0001234',
    branch: 'MMMUT Branch, Gorakhpur',
    upiId: 'shortcircuit@sbi',
  };

  const outPath = path.resolve(process.cwd(), 'uploads/invoices/test-verify-invoice.pdf');
  console.log('Generating test PDF to:', outPath);
  await generateInvoicePdf(dummyInvoice, company, outPath);

  if (fs.existsSync(outPath)) {
    const size = fs.statSync(outPath).size;
    console.log(`✅ Success! Generated test PDF file size: ${size} bytes`);
  } else {
    throw new Error('Test PDF file was not created');
  }
}

testPdf().catch((err) => {
  console.error('❌ Test PDF error:', err);
  process.exit(1);
});
