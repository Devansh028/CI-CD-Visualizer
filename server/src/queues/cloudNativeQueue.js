const { Queue } = require("bullmq");
const { redisConnection } = require("../config/redis");
const logger = require("../utils/logger");

const QUEUE_NAME = "cloud-native-queue";

const cloudNativeQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

cloudNativeQueue.on("error", (err) => {
  logger.error(`[Queue] Cloud Native queue connection error: ${err.message}`);
});

logger.info(`BullMQ queue '${QUEUE_NAME}' initialized successfully.`);

module.exports = {
  cloudNativeQueue,
  QUEUE_NAME
};
