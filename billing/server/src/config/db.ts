import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    console.warn('⚠️ [MongoDB] Warning: Real MongoDB password not set in .env yet. Database operations will fail until valid password is provided.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ [MongoDB] Connection error:', error);
  }
}
