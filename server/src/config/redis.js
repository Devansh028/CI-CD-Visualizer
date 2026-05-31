const redisConnection = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  // BullMQ requires maxRetriesPerRequest to be explicitly set to null
  maxRetriesPerRequest: null,
};

module.exports = {
  redisConnection,
};
