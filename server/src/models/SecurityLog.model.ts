// ============================================================================
// ElectroKart — SecurityLog Model
// ============================================================================
// Stores audit logs of security-sensitive events, such as refresh token
// reuse (hijacking attempts).
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ISecurityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: 'refresh_token_reuse' | string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const securityLogSchema = new Schema<ISecurityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      index: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
    },
    userAgent: {
      type: String,
      required: [true, 'User Agent is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

securityLogSchema.index({ userId: 1, eventType: 1 });
securityLogSchema.index({ createdAt: -1 });

// TTL index — Automatically delete logs older than 90 days
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const SecurityLog = mongoose.model<ISecurityLog>('SecurityLog', securityLogSchema);

export default SecurityLog;
