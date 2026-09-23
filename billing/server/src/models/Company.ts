import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId?: string;
  logoPath?: string;
  stampPath?: string;
  defaultPrefix: string;
  defaultTerms: string[];
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, default: 'ShortCircuit' },
    tagline: { type: String, default: 'Robotics, Electronics & Innovation Lab' },
    address: { type: String, required: true, default: 'Shop No. 12, Ground Floor, Electronics Market' },
    city: { type: String, required: true, default: 'Gorakhpur' },
    state: { type: String, required: true, default: 'Uttar Pradesh' },
    stateCode: { type: String, required: true, default: '09' },
    pincode: { type: String, default: '273010' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'sales@shortcircuit.in' },
    website: { type: String, default: 'www.shortcircuit.in' },
    gstin: { type: String, default: '09AAACE1234F1Z5' },
    pan: { type: String, default: 'AAACE1234F' },
    bankName: { type: String, default: 'State Bank of India' },
    accountNo: { type: String, default: '39485720194' },
    ifsc: { type: String, default: 'SBIN0001234' },
    branch: { type: String, default: 'MMMUT Branch, Gorakhpur' },
    upiId: { type: String, default: 'shortcircuit@sbi' },
    logoPath: { type: String, default: '' },
    stampPath: { type: String, default: '' },
    defaultPrefix: { type: String, default: 'SC/2026/' },
    defaultTerms: {
      type: [String],
      default: [
        'Warranty as per manufacturer terms and conditions.',
        'Goods once sold will not be taken back or exchanged.',
        'Subject to Gorakhpur jurisdiction only.',
      ],
    },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
