import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku?: string;
  description?: string;
  hsn: string;
  unit: string;
  unitPrice: number;
  gstRate: number; // e.g. 18 for 18%
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    description: { type: String, default: '' },
    hsn: { type: String, required: true, default: '8542' },
    unit: { type: String, default: 'NOS' },
    unitPrice: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, required: true, default: 18 },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
