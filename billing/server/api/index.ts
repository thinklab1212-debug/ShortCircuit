import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { ensureDefaultAdmin } from '../src/controllers/authController.js';

let isReady = false;

async function prepare() {
  if (!isReady) {
    await connectDB();
    await ensureDefaultAdmin();
    isReady = true;
  }
}

export default async function handler(req: any, res: any) {
  await prepare();
  return app(req, res);
}
