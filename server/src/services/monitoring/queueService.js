const { deploymentQueue } = require("../../queues/deploymentQueue");
const logger = require("../../utils/logger");

/**
 * Retrieves the count of waiting, active, completed, failed, and delayed jobs in BullMQ.
 * 
 * @returns {Promise<Object>} Job count metrics
 */
const getQueueStats = async () => {
  try {
    const counts = await deploymentQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  } catch (error) {
    logger.error(`Error querying BullMQ stats: ${error.message}`);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
};

module.exports = {
  getQueueStats,
};
