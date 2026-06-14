// ============================================================================
// ElectroKart — Token Model (Refresh Tokens)
// ============================================================================
// Stores hashed refresh tokens per user session. Uses a TTL index to
// automatically purge expired tokens from MongoDB. Supports multiple
// active sessions per user (multi-device login).
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;               // bcrypt-hashed refresh token
  userAgent?: string;          // Device/browser identifier
  ipAddress?: string;          // IP of the session origin
  expiresAt: Date;
  status: 'active' | 'rotated'; // Rotation status
  rotatedAt?: Date;            // When the token was rotated
  createdAt: Date;
}

export interface ITokenModel extends Model<IToken> {
  /**
   * Removes all refresh tokens for a given user (e.g., on password change).
   */
  revokeAllForUser(userId: mongoose.Types.ObjectId): Promise<void>;

  /**
   * Cleans up expired tokens (backup for TTL index).
   */
  cleanupExpired(): Promise<number>;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const tokenSchema = new Schema<IToken, ITokenModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'rotated'],
        message: 'Status must be active or rotated',
      },
      default: 'active',
      required: true,
    },
    rotatedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// TTL index — MongoDB automatically deletes documents when expiresAt passes
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index — MongoDB automatically deletes rotated documents 30 days after rotatedAt
tokenSchema.index({ rotatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound index for looking up user tokens
tokenSchema.index({ userId: 1, token: 1 });

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

tokenSchema.statics.revokeAllForUser = async function (
  userId: mongoose.Types.ObjectId
): Promise<void> {
  await this.deleteMany({ userId });
};

tokenSchema.statics.cleanupExpired = async function (): Promise<number> {
  const result = await this.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount;
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Token = mongoose.model<IToken, ITokenModel>('Token', tokenSchema);

export default Token;
