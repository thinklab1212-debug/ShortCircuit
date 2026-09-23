import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminUser extends Document {
  email: string;
  password: string;
  name: string;
  comparePassword(entered: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

AdminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminUserSchema.methods.comparePassword = async function (entered: string): Promise<boolean> {
  return bcrypt.compare(entered, this.password);
};

export const AdminUser = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
