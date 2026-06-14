// ============================================================================
// ElectroKart — Invoice Settings Model
// ============================================================================
// Stores admin-managed dynamic metadata for billing, branding logo/stamp,
// tax structures, prefix identifiers, and toggles.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceSettings extends Document {
  companyName: string;
  gstin: string;
  businessAddress: string;
  contactNumber: string;
  supportEmail: string;
  companyLogo?: string;
  companyStamp?: string;
  invoicePrefix: string;
  startingInvoiceNumber: number;
  autoIncrementInvoiceNumber: boolean;
  currencySymbol: string;
  footerMessage: string;
  gstPercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  allowOnlyDeliveredAndPaid: boolean;
  isInvoiceEnabled: boolean;
  nextInvoiceNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSettingsSchema = new Schema<IInvoiceSettings>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      default: 'EngineersBuy Instruments',
    },
    gstin: {
      type: String,
      required: [true, 'GSTIN is required'],
      default: '29AAAAA0000A1Z5',
    },
    businessAddress: {
      type: String,
      required: [true, 'Business address is required'],
      default: '102 Maker Space Hub, Science City Block, Bangalore, Karnataka - 560001',
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      default: '+91 80 1234 5678',
    },
    supportEmail: {
      type: String,
      required: [true, 'Support email is required'],
      default: 'billing@electrokart.com',
    },
    companyLogo: {
      type: String,
      default: '',
    },
    companyStamp: {
      type: String,
      default: '',
    },
    invoicePrefix: {
      type: String,
      required: [true, 'Invoice prefix is required'],
      default: 'SC',
    },
    startingInvoiceNumber: {
      type: Number,
      required: [true, 'Starting invoice number is required'],
      default: 1,
    },
    nextInvoiceNumber: {
      type: Number,
      required: [true, 'Next invoice number is required'],
      default: 1,
    },
    autoIncrementInvoiceNumber: {
      type: Boolean,
      required: true,
      default: true,
    },
    currencySymbol: {
      type: String,
      required: [true, 'Currency symbol is required'],
      default: '₹',
    },
    footerMessage: {
      type: String,
      required: [true, 'Footer message is required'],
      default: 'This is a computer-generated invoice.',
    },
    gstPercentage: {
      type: Number,
      required: [true, 'GST percentage is required'],
      default: 18,
    },
    cgstPercentage: {
      type: Number,
      required: [true, 'CGST percentage is required'],
      default: 9,
    },
    sgstPercentage: {
      type: Number,
      required: [true, 'SGST percentage is required'],
      default: 9,
    },
    igstPercentage: {
      type: Number,
      required: [true, 'IGST percentage is required'],
      default: 18,
    },
    allowOnlyDeliveredAndPaid: {
      type: Boolean,
      required: true,
      default: true,
    },
    isInvoiceEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const InvoiceSettings = mongoose.model<IInvoiceSettings>('InvoiceSettings', invoiceSettingsSchema);

export default InvoiceSettings;
