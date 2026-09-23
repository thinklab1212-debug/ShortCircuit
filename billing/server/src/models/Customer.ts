import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    companyName: { type: String },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    state: { type: String, required: true, default: 'Uttar Pradesh' },
    stateCode: { type: String, required: true, default: '09' },
    pincode: { type: String, default: '' },
    gstin: { type: String, default: '' },
    pan: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
