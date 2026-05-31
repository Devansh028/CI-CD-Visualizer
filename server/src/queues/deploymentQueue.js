const { Queue } = require("bullmq");
const { redisConnection } = require("../config/redis");
const logger = require("../utils/logger");

const QUEUE_NAME = "deployment-queue";

// Create BullMQ queue connected to Redis
const deploymentQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

// Attach error listener to prevent unhandled Redis connection crashes
deploymentQueue.on("error", (err) => {
  logger.error(`[Queue] BullMQ queue connection error: ${err.message}`);
});

logger.info(`BullMQ queue '${QUEUE_NAME}' initialized successfully.`);

module.exports = {
  deploymentQueue,
  QUEUE_NAME,
};
