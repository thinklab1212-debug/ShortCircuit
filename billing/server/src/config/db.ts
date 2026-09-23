import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    console.warn('⚠️ [MongoDB] Warning: MONGODB_URI not set or contains placeholder in .env.');
    return;
  }

  // Already connected in this container/lambda
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    const conn = await cachedPromise;
    console.log(`✅ [MongoDB] Connected: ${conn.connection.name} @ ${conn.connection.host}`);
  } catch (error) {
    cachedPromise = null;
    console.error('❌ [MongoDB] Connection error:', error);
  }
}
