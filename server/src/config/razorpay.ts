// ============================================================================
// ElectroKart — Razorpay Configuration
// ============================================================================
// Configures and exports the Razorpay SDK instance for managing payments,
// orders, verification signatures, and refunds.
// ============================================================================

import Razorpay from 'razorpay';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Razorpay Client Initialization
// ---------------------------------------------------------------------------

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
