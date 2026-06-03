// ============================================================================
// ElectroKart — Environment Variable Type Declarations
// ============================================================================
// Augments the NodeJS.ProcessEnv interface so that all environment
// variables used in the application are known to TypeScript. This
// provides autocomplete in `process.env.VARIABLE_NAME` and catches
// typos at compile time.
//
// NOTE: This does NOT validate that variables are set at runtime —
// that's handled by `config/env.ts`. This only provides type safety.
// ============================================================================

declare namespace NodeJS {
  interface ProcessEnv {
    // -----------------------------------------------------------------------
    // App
    // -----------------------------------------------------------------------
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    CLIENT_URL: string;
    API_VERSION: string;

    // -----------------------------------------------------------------------
    // Database
    // -----------------------------------------------------------------------
    MONGODB_URI: string;

    // -----------------------------------------------------------------------
    // JWT
    // -----------------------------------------------------------------------
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;

    // -----------------------------------------------------------------------
    // Cloudinary
    // -----------------------------------------------------------------------
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;

    // -----------------------------------------------------------------------
    // Razorpay
    // -----------------------------------------------------------------------
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    RAZORPAY_WEBHOOK_SECRET: string;

    // -----------------------------------------------------------------------
    // Email (Resend)
    // -----------------------------------------------------------------------
    RESEND_API_KEY: string;
    EMAIL_FROM: string;

    // -----------------------------------------------------------------------
    // Rate Limiting
    // -----------------------------------------------------------------------
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;
  }
}
