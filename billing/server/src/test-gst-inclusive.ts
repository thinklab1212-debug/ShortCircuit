import { api } from '../client/src/api/client.js';

async function testGstAndFreight() {
  console.log('Testing GST-Inclusive & Freight Calculations...');
  
  // 1. Login
  const loginRes = await fetch('http://localhost:5050/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shortcircuit.in', password: 'ShortCircuit@2026' }),
  });
  const loginData = await loginRes.json();
  console.log('Auth check:', loginRes.status, loginData.user?.email, 'Token exists:', Boolean(loginData.token));

  // 2. Create invoice with GST inclusive item, kit item, and freight charges
  const invPayload = {
    invoiceNo: `TEST/INC/${Date.now().toString().slice(-4)}`,
    placeOfSupply: 'Uttar Pradesh (09)',
    paymentMode: 'UPI',
    paymentStatus: 'PAID',
    customer: {
      name: 'Rohan Sharma',
      address: '14/B Civil Lines, Gorakhpur',
      state: 'Uttar Pradesh',
      stateCode: '09',
      phone: '9876543210',
    },
    freightCharges: 150,
    items: [
      {
        name: 'Arduino Uno R3 DIP',
        hsn: '8542',
        qty: 2,
        unit: 'NOS',
        inclusivePrice: 590, // Website price inclusive of 18% GST (unit taxable: 500)
        unitPrice: 500,
        gstRate: 18,
        discount: 0,
      },
      {
        name: 'Obstacle Avoidance Robot Kit',
        hsn: '9503',
        qty: 1,
        unit: 'SET',
        isKit: true,
        kitItems: [
          '1x Arduino Uno R3',
          '1x L298N Motor Driver',
          '1x HC-SR04 Ultrasonic Sensor',
          '1x SG90 Micro Servo',
          '2x TT Gear Motor with Wheels',
          '1x 2WD Robot Chassis Acrylic Frame',
        ],
        inclusivePrice: 1416, // Website price inclusive of 18% GST (taxable: 1200)
        unitPrice: 1200,
        gstRate: 18,
        discount: 0,
      },
    ],
  };

  const createRes = await fetch('http://localhost:5050/api/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`,
    },
    body: JSON.stringify(invPayload),
  });

  const createData = await createRes.json();
  console.log('Invoice Creation Status:', createRes.status);
  if (!createRes.ok) {
    console.error('Create error:', createData);
    return;
  }

  const inv = createData.invoice;
  console.log('Invoice No:', inv.invoiceNo);
  console.log('Taxable Subtotal:', inv.taxableSubtotal); // Expected: 1000 + 1200 = 2200
  console.log('CGST Total:', inv.cgstTotal);             // Expected: 2200 * 9% = 198
  console.log('SGST Total:', inv.sgstTotal);             // Expected: 2200 * 9% = 198
  console.log('Freight Charges:', inv.freightCharges);   // Expected: 150
  console.log('Grand Total:', inv.grandTotal);           // Expected: 2200 + 198 + 198 + 150 = 2746
  console.log('Amount in Words:', inv.amountInWords);
  console.log('PDF Path:', inv.pdfLocalPath);
}

testGstAndFreight().catch(console.error);
