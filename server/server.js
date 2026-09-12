import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create HTTP server
    server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    // Start HTTP server listening
    server.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`[BugBounty API] Server running on port ${PORT}`);
      console.log(`[BugBounty API] WebSocket real-time engine active`);
      console.log(`[BugBounty API] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[BugBounty API] Health check: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('[BugBounty API] Fatal error during startup:', error.message);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\n[BugBounty API] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[BugBounty API] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
