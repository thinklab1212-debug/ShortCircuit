import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/api.js';
import { getUploadsDir } from './config/paths.js';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin on Vercel)
    if (!origin) return callback(null, true);
    // Allow vercel preview and production deployments, localhost
    if (
      origin === CLIENT_URL ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for easy billing integration
  },
  credentials: true,
}));

app.use(express.json());

// Static uploads serving (for local and temp files)
const uploadsDir = getUploadsDir();
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ShortCircuit Billing Backend',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Standalone',
    time: new Date().toISOString(),
  });
});

// Primary API Router
app.use('/api', apiRouter);

export default app;
export { app };
