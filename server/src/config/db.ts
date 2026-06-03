// ============================================================================
// ElectroKart — MongoDB Connection
// ============================================================================
// Handles MongoDB Atlas connection with retry logic, event listeners,
// and graceful shutdown. Uses Mongoose 8.x with strict query mode.
// ============================================================================

import mongoose from 'mongoose';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Connection options
// ---------------------------------------------------------------------------

const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 2,
  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // Auto-create indexes in development
  autoIndex: env.IS_DEVELOPMENT,
};

// ---------------------------------------------------------------------------
// Connect to MongoDB
// ---------------------------------------------------------------------------

export async function connectDatabase(): Promise<void> {
  try {
    // Enable strict query mode — disallow unknown fields in queries
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGODB_URI, MONGOOSE_OPTIONS);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   ReadyState: ${conn.connection.readyState}`);

    // -----------------------------------------------------------------------
    // Connection event listeners
    // -----------------------------------------------------------------------

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
