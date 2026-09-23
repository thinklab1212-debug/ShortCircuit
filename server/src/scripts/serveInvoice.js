import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5055;
const pdfPath = path.resolve('d:/ShortCircuit/Invoice-EB-2026-80.pdf');

// Direct download route
app.get('/download', (req, res) => {
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath, 'Invoice-EB-2026-80.pdf');
  } else {
    res.status(404).send('Invoice file not found.');
  }
});

// View / Stream PDF
app.get('/Invoice-EB-2026-80.pdf', (req, res) => {
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Invoice-EB-2026-80.pdf"');
    fs.createReadStream(pdfPath).pipe(res);
  } else {
    res.status(404).send('Invoice file not found.');
  }
});

// Interactive preview & download portal
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice - EB/2026/80 | EngineersBuy Instruments</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    main {
      flex: 1;
      display: flex;
      padding: 24px;
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }
    .info-card {
      width: 380px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: fit-content;
    }
    .meta-group {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 12px;
    }
    .meta-group:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .total-box {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .pdf-viewer-wrap {
      flex: 1;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 800px;
    }
    iframe {
      width: 100%;
      height: 100%;
      min-height: 820px;
      border: none;
    }
  </style>
</head>
<body>
  <header>
    <div style="display: flex; align-items: center; gap: 16px;">
      <h1 style="font-size: 18px; font-weight: 700;">Tax Invoice <span style="color: #60a5fa;">#EB/2026/80</span></h1>
      <span class="badge">Cash Payment Received</span>
    </div>
    <div class="actions">
      <a href="/Invoice-EB-2026-80.pdf" target="_blank" class="btn btn-secondary">Open PDF Tab</a>
      <a href="/download" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download Invoice PDF
      </a>
    </div>
  </header>

  <main>
    <div class="info-card">
      <div class="meta-group">
        <div class="meta-label">Billed To (Customer)</div>
        <div class="meta-value">IEEE STB MMMUT</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Madan Mohan Malaviya University of Technology, Gorakhpur, UP - 273010</div>
      </div>

      <div class="meta-group">
        <div class="meta-label">Billed By (Seller)</div>
        <div class="meta-value">EngineersBuy Instruments</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Okhla, Delhi - 110044<br/>GSTIN: 07EGQPP9381B1ZU</div>
      </div>

      <div class="meta-group">
        <div class="meta-label">Line Items (HSN Specified)</div>
        <div style="font-size: 12px; color: #cbd5e1; display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
          <div><b>1. Microcontroller Board Kit</b> (HSN: 8542) &bull; ₹2,500.00</div>
          <div><b>2. Sensor, Modules and Bot Kit</b> (HSN: 8080) &bull; ₹6,200.00</div>
          <div><b>3. Tool Kit</b> (HSN: 82060010) &bull; ₹4,694.00 (Incl. GST)</div>
        </div>
      </div>

      <div class="meta-group">
        <div class="meta-label">Tax Breakdown</div>
        <div style="font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 4px;">
          <span>Subtotal (Before Tax):</span>
          <span style="color: #f1f5f9; font-weight: 600;">₹12,678.00</span>
        </div>
        <div style="font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 4px;">
          <span>IGST @ 18%:</span>
          <span style="color: #f1f5f9; font-weight: 600;">₹2,282.04</span>
        </div>
        <div style="font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 4px;">
          <span>Round Off:</span>
          <span style="color: #34d399; font-weight: 600;">(-) ₹0.04</span>
        </div>
      </div>

      <div class="total-box">
        <div style="font-size: 11px; text-transform: uppercase; color: #93c5fd; letter-spacing: 0.05em;">Total Amount Paid</div>
        <div style="font-size: 26px; font-weight: 700; color: #ffffff; margin-top: 4px;">₹14,960.00</div>
        <div style="font-size: 11px; color: #bfdbfe; margin-top: 2px;">Fourteen Thousand Nine Hundred Sixty Only</div>
      </div>

      <a href="/download" class="btn btn-primary" style="justify-content: center; width: 100%;">
        Download PDF Now
      </a>
    </div>

    <div class="pdf-viewer-wrap">
      <iframe src="/Invoice-EB-2026-80.pdf#toolbar=1&navpanes=0"></iframe>
    </div>
  </main>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Manual Invoice Portal listening at http://localhost:${PORT}`);
  console.log(`Direct PDF download available at http://localhost:${PORT}/download`);
  console.log(`Direct PDF stream available at http://localhost:${PORT}/Invoice-EB-2026-80.pdf`);
});
