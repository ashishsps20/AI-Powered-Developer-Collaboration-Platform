import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import connectDB from './config/db.js';
import { socketService } from './services/socket.service.js';
import { initRedis, closeRedis } from './config/redis.js';
import { initGithubWorker, closeGithubWorker } from './workers/github.worker.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Initialize Redis
  initRedis();

  // Start HTTP Server
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port http://localhost:${PORT}`);
  });

  // Initialize Socket.IO
  socketService.init(server);

  // Initialize Workers
  initGithubWorker();
};

startServer();

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  
  // Close workers first to stop accepting new jobs
  await closeGithubWorker();

  // Close Redis connections
  await closeRedis();

  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Do not exit immediately in all cases, but log it clearly
});
