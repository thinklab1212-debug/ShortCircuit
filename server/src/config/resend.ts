// ============================================================================
// ElectroKart — Resend Configuration
// ============================================================================
// Configures and exports the Resend email service client for sending
// transactional emails (verification, order confirmation, password resets).
// ============================================================================

import { Resend } from 'resend';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Resend Client Initialization
// ---------------------------------------------------------------------------

export const resend = new Resend(env.RESEND_API_KEY);

export default resend;
