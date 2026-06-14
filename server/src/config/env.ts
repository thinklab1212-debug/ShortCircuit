// ============================================================================
// ElectroKart — Environment Configuration (Zod-Validated)
// ============================================================================
// Validates ALL environment variables at application startup using Zod.
// If any required variable is missing or malformed, the app crashes
// immediately with a clear, actionable error message.
//
// Supports three environments: development, staging, production.
// Exports a strongly-typed, frozen `env` object used across the app.
//
// Usage:
//   import { env } from '@/config/env';
//   console.log(env.PORT);             // number — guaranteed to exist
//   console.log(env.IS_PRODUCTION);    // boolean — computed getter
// ============================================================================

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load .env file based on NODE_ENV
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Load environment-specific .env file first, then base .env as fallback
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = [
  path.resolve(rootDir, `.env.${nodeEnv}`),   // .env.development, .env.staging, .env.production
  path.resolve(rootDir, '.env'),               // Base fallback
];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile });
}

// ---------------------------------------------------------------------------
// Zod Schema — defines shape, types, defaults, and validation rules
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // -----------------------------------------------------------------------
  // App
  // -----------------------------------------------------------------------
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development')
    .describe('Application environment'),

  PORT: z
    .string()
    .default('5000')
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .describe('Server port number'),

  CLIENT_URL: z
    .string()
    .url('CLIENT_URL must be a valid URL')
    .default('http://localhost:5173')
    .describe('Frontend application URL (for CORS and email links)'),

  API_VERSION: z
    .string()
    .default('v1')
    .describe('API version prefix'),

  // -----------------------------------------------------------------------
  // Database
  // -----------------------------------------------------------------------
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .startsWith('mongodb', 'MONGODB_URI must be a valid MongoDB connection string')
    .describe('MongoDB Atlas connection string'),

  // -----------------------------------------------------------------------
  // JWT
  // -----------------------------------------------------------------------
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security')
    .describe('Secret key for signing JWT access tokens'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security')
    .describe('Secret key for hashing refresh tokens'),

  JWT_ACCESS_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_EXPIRY must be like 15m, 1h, 7d')
    .default('15m')
    .describe('Access token lifetime (e.g., 15m, 1h)'),

  JWT_REFRESH_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRY must be like 7d, 30d')
    .default('7d')
    .describe('Refresh token lifetime (e.g., 7d, 30d)'),

  COOKIE_DOMAIN: z
    .string()
    .optional()
    .describe('Cookie domain mapping (for cross-subdomain sharing)'),

  GMAIL_USER: z
    .string()
    .email()
    .default('u.k.s200503@gmail.com')
    .describe('Gmail address for dynamic nodemailer sending'),

  GMAIL_APP_PASSWORD: z
    .string()
    .optional()
    .describe('App Password for GMail account'),

  // -----------------------------------------------------------------------
  // Cloudinary
  // -----------------------------------------------------------------------
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, 'CLOUDINARY_CLOUD_NAME is required')
    .describe('Cloudinary account cloud name'),

  CLOUDINARY_API_KEY: z
    .string()
    .min(1, 'CLOUDINARY_API_KEY is required')
    .describe('Cloudinary API key'),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, 'CLOUDINARY_API_SECRET is required')
    .describe('Cloudinary API secret'),

  // -----------------------------------------------------------------------
  // Razorpay
  // -----------------------------------------------------------------------
  RAZORPAY_KEY_ID: z
    .string()
    .min(1, 'RAZORPAY_KEY_ID is required')
    .describe('Razorpay API key ID'),

  RAZORPAY_KEY_SECRET: z
    .string()
    .min(1, 'RAZORPAY_KEY_SECRET is required')
    .describe('Razorpay API key secret'),

  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .default('')
    .describe('Razorpay webhook signature verification secret'),

  // -----------------------------------------------------------------------
  // Email (Resend)
  // -----------------------------------------------------------------------
  RESEND_API_KEY: z
    .string()
    .min(1, 'RESEND_API_KEY is required')
    .describe('Resend email service API key'),

  EMAIL_FROM: z
    .string()
    .default('ElectroKart <noreply@electrokart.com>')
    .describe('Default sender address for transactional emails'),

  // -----------------------------------------------------------------------
  // Rate Limiting
  // -----------------------------------------------------------------------
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform(Number)
    .pipe(z.number().int().min(1000))
    .describe('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform(Number)
    .pipe(z.number().int().min(1))
    .describe('Maximum requests per window'),

  // -----------------------------------------------------------------------
  // Optional / Feature Flags
  // -----------------------------------------------------------------------
  ADMIN_EMAIL: z
    .string()
    .email()
    .optional()
    .describe('Default admin account email (used by seeder)'),

  ADMIN_PASSWORD: z
    .string()
    .min(8)
    .optional()
    .describe('Default admin account password (used by seeder)'),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info')
    .describe('Winston log level'),

  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true')
    .describe('Enable/disable Swagger documentation UI'),
});

// ---------------------------------------------------------------------------
// Alias FRONTEND_URL to CLIENT_URL if not directly set
if (!process.env.CLIENT_URL && process.env.FRONTEND_URL) {
  process.env.CLIENT_URL = process.env.FRONTEND_URL;
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Environment variable validation failed:\n');

  const errors = parsed.error.flatten().fieldErrors;

  for (const [field, messages] of Object.entries(errors)) {
    console.error(`  ✗ ${field}:`);
    for (const msg of messages || []) {
      console.error(`    → ${msg}`);
    }
  }

  console.error('\n📋 Check your .env file against .env.example\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Exported typed config object
// ---------------------------------------------------------------------------

/**
 * Validated, strongly-typed environment configuration.
 * Frozen to prevent accidental mutation.
 */
export const env = Object.freeze({
  ...parsed.data,

  // -----------------------------------------------------------------------
  // Computed properties
  // -----------------------------------------------------------------------

  /** True when NODE_ENV is 'production' */
  get IS_PRODUCTION(): boolean {
    return parsed.data.NODE_ENV === 'production';
  },

  /** True when NODE_ENV is 'development' */
  get IS_DEVELOPMENT(): boolean {
    return parsed.data.NODE_ENV === 'development';
  },

  /** True when NODE_ENV is 'staging' */
  get IS_STAGING(): boolean {
    return parsed.data.NODE_ENV === 'staging';
  },

  /** True when NODE_ENV is 'test' */
  get IS_TEST(): boolean {
    return parsed.data.NODE_ENV === 'test';
  },

  /** Full API base path: /api/v1 */
  get API_BASE_PATH(): string {
    return `/api/${parsed.data.API_VERSION}`;
  },
});

// ---------------------------------------------------------------------------
// Export the Zod schema type for reuse
// ---------------------------------------------------------------------------

export type EnvConfig = z.infer<typeof envSchema>;
