// ============================================================================
// ElectroKart — API Server Entrypoint
// ============================================================================
// Validates environment config, connects to MongoDB Atlas, instantiates the
// HTTP server, and registers graceful termination event listeners.
// ============================================================================

import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { logger } from './utils/index.js';

let server: http.Server;

async function startServer() {
  logger.info('🚀 Starting ElectroKart API Server...');

  // 1. Establish Database Connection (fails application if connection fails)
  await connectDatabase();

  // 2. Instantiate and Start HTTP Server
  server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`✅ Server listening on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    logger.info(`🔗 Base URL: http://localhost:${env.PORT}`);
    if (env.SWAGGER_ENABLED) {
      logger.info(`📑 API Documentation: http://localhost:${env.PORT}${env.API_BASE_PATH}/docs`);
    }
  });

  // Handle server connection socket errors
  server.on('error', (error: any) => {
    logger.error('❌ Server socket runtime error:', error);
    process.exit(1);
  });
}

// 3. Coordinated Graceful Shutdown
async function gracefulShutdown(signal: string) {
  logger.warn(`🔌 Received ${signal}. Initiating graceful shutdown...`);

  // Enforce a hard timeout limit of 10s to prevent hanging processes
  const forceQuitTimeout = setTimeout(() => {
    logger.error('❌ Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);

  if (server) {
    logger.info('🛑 Stopping Express HTTP server from accepting new requests...');
    server.close(async (err) => {
      if (err) {
        logger.error('❌ Error during Express server socket close:', err);
      } else {
        logger.info('✅ Express server connections drained successfully.');
      }

      // Safely close database connection
      await disconnectDatabase();

      clearTimeout(forceQuitTimeout);
      logger.info('👋 ElectroKart shutdown complete.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    clearTimeout(forceQuitTimeout);
    logger.info('👋 ElectroKart shutdown complete.');
    process.exit(0);
  }
}

// 4. Exception & Rejection Listeners
process.on('uncaughtException', (error) => {
  logger.error('🔥 Uncaught Exception detected:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error('🔥 Unhandled Promise Rejection detected:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Intercept OS termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
