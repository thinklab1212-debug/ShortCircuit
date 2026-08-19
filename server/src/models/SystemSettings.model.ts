// ============================================================================
// ElectroKart — System Settings Model
// ============================================================================
// Stores admin-managed dynamic application flags, storefront maintenance mode,
// messaging, and global preferences.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  isMaintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceETA?: string;
  codEnabled: boolean;
  guestCheckoutEnabled: boolean;
  emailNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    isMaintenanceMode: {
      type: Boolean,
      required: true,
      default: false,
    },
    maintenanceTitle: {
      type: String,
      required: true,
      default: 'Store Under Maintenance',
    },
    maintenanceMessage: {
      type: String,
      required: true,
      default: 'We are currently performing scheduled system updates. Please check back shortly.',
    },
    maintenanceETA: {
      type: String,
      default: '',
    },
    codEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    guestCheckoutEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Helper static method to retrieve or lazily initialize single instance of settings document
 */
systemSettingsSchema.statics.getSettings = async function (): Promise<ISystemSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export interface ISystemSettingsModel extends mongoose.Model<ISystemSettings> {
  getSettings(): Promise<ISystemSettings>;
}

const SystemSettings = mongoose.model<ISystemSettings, ISystemSettingsModel>(
  'SystemSettings',
  systemSettingsSchema
);

export default SystemSettings;
