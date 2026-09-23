import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { ensureDefaultAdmin } from './controllers/authController.js';
import { syncComponentsFromStore } from './scripts/syncFromStore.js';

const PORT = process.env.PORT || 5050;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

// Start standalone server
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
        .catch((err: any) => console.warn('ℹ️ [Auto-Sync] Store sync skipped (Network/Atlas whitelist restriction):', err?.message || err));
    }, 5000);

    // Periodic auto-sync every 10 minutes
    setInterval(() => {
      syncComponentsFromStore()
        .then(() => console.log('🔄 [Auto-Sync] Periodic store sync completed.'))
        .catch((err: any) => console.warn('ℹ️ [Auto-Sync] Periodic sync skipped:', err?.message || err));
    }, 10 * 60 * 1000);
  });
}

start();
