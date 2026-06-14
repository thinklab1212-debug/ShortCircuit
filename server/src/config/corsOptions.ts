// ============================================================================
// ElectroKart — CORS Configuration
// ============================================================================
// Defines options for the CORS middleware, managing allowed origins, methods,
// and headers. Ensures secure cookie sharing for JWT credentials.
// ============================================================================

import { CorsOptions } from 'cors';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Whitelist of Allowed Origins
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  env.CLIENT_URL,
  'https://www.shortcircuit.co.in',
  'https://shortcircuit.co.in',
  'http://localhost:5173', // Vite default development port
  'http://localhost:3000', // Alternative dev port
  'http://127.0.0.1:5173', // Loopback dev port
];

// ---------------------------------------------------------------------------
// CORS Options Configuration
// ---------------------------------------------------------------------------

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      ALLOWED_ORIGINS.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app') ||
      env.IS_DEVELOPMENT;

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: Origin ${origin} is not whitelisted.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
  ],
  credentials: true, // Enable cookies/authorization headers
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

export default corsOptions;
