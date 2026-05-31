require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./websocket/socketServer");
const { startDeploymentWorker } = require("./workers/deploymentWorker");
const { startCloudNativeWorker } = require("./workers/cloudNativeWorker");
const logger = require("./utils/logger");

const { startMetricsMonitoring, stopMetricsMonitoring } = require("./services/monitoring");
const { startCleanupInterval, stopCleanupInterval } = require("./services/docker/cleanupService");

// Connect to Database
connectDB();

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO WebSockets
const io = initSocket(server);

// Start background DevOps metrics monitoring system
startMetricsMonitoring(io);

// Start BullMQ Worker Processes
const worker = startDeploymentWorker();
const cnWorker = startCloudNativeWorker();

// Start background Docker and workspace directory cleanup loops
startCleanupInterval();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

/**
 * Handle graceful termination of process databases, queues, socket channels and listening ports.
 * 
 * @param {string} signal - Triggering system signal
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Process termination triggered via ${signal}. Starting graceful shutdown...`);
  
  // 1. Suspend background monitoring and cleanup loops
  stopMetricsMonitoring();
  stopCleanupInterval();
  
  // 2. Terminate the HTTP server listener
  server.close(() => {
    logger.info("HTTP server closed and socket connections terminated.");
  });

  // 3. Stop and close the BullMQ workers
  if (worker) {
    try {
      await worker.close();
      logger.info("BullMQ worker stopped accepting new jobs.");
    } catch (err) {
      logger.error(`Error closing BullMQ worker: ${err.message}`);
    }
  }

  if (cnWorker) {
    try {
      await cnWorker.close();
      logger.info("BullMQ Cloud Native worker stopped.");
    } catch (err) {
      logger.error(`Error closing BullMQ Cloud Native worker: ${err.message}`);
    }
  }

  // 4. Disconnect Mongoose pool
  try {
    await mongoose.connection.close();
    logger.info("MongoDB database connection pools closed.");
  } catch (err) {
    logger.error(`Error closing MongoDB connection: ${err.message}`);
  }

  logger.info("Graceful shutdown process completed. Exiting.");
  process.exit(signal === "uncaughtException" || signal === "unhandledRejection" ? 1 : 0);
};

// Listeners for process lifecycle events
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`, { stack: err.stack });
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  gracefulShutdown("uncaughtException");
});