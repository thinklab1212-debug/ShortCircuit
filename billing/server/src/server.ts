import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';
import { syncComponentsFromStore } from './scripts/syncFromStore.js';
import { ensureDefaultAdmin } from './controllers/authController.js';

const app = express();
const PORT = process.env.PORT || 5050;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

// Ensure uploads directories exist
const uploadsDir = path.resolve(process.cwd(), 'uploads/invoices');
const brandingDir = path.resolve(process.cwd(), 'uploads/branding');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(brandingDir)) fs.mkdirSync(brandingDir, { recursive: true });

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ShortCircuit Billing Backend', time: new Date().toISOString() });
});

app.use('/api', apiRouter);

// Start
async function start() {
  await connectDB();
  await ensureDefaultAdmin();
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 [Billing Server] Running on http://localhost:${PORT}`);
    console.log(`📑 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Allowed Client: ${CLIENT_URL}`);
    console.log(`=========================================`);

    // Automatic store sync on startup after 5 seconds delay
    setTimeout(() => {
      syncComponentsFromStore()
        .then(() => console.log('🔄 [Auto-Sync] Startup catalog sync finished.'))
        .catch((err) => console.warn('ℹ️ [Auto-Sync] Store sync skipped (Network/Atlas whitelist restriction):', err.message));
    }, 5000);

    // Periodic auto-sync every 10 minutes
    setInterval(() => {
      syncComponentsFromStore()
        .then(() => console.log('🔄 [Auto-Sync] Periodic store sync completed.'))
        .catch((err) => console.warn('ℹ️ [Auto-Sync] Periodic sync skipped:', err.message));
    }, 10 * 60 * 1000);
  });
}

start();
