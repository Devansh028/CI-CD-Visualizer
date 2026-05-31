const { deploymentQueue } = require("../queues/deploymentQueue");
const logger = require("../utils/logger");
const { getIO } = require("../websocket/socket");

/**
 * Pushes a new deployment task to the BullMQ queue.
 * Integrates error tracing, Mongoose fail updates, and Socket.IO real-time events.
 * 
 * @param {Object} project - The Project mongoose document
 * @param {Object} deployment - The Deployment mongoose document
 */
const triggerDeploymentJob = async (project, deployment) => {
  try {
    logger.info(`[Queue Service] Preparing to queue build job for project: ${project.name}`);

    // 1. Add job to BullMQ
    const job = await deploymentQueue.add(
      "deploy-job",
      {
        projectId: project._id.toString(),
        repoUrl: project.repoUrl,
        branch: deployment.branch,
        commitHash: deployment.commitHash,
        triggerType: deployment.triggerType,
        deploymentId: deployment._id.toString(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true, // Clean up successful jobs
        removeOnFail: false,    // Keep failed jobs for debugging
      }
    );

    logger.info(`[Queue Service] Job added to BullMQ. Job ID: ${job.id}`);

    // 2. Emit WebSocket deployment:queued event
    try {
      const io = getIO();
      io.to(project._id.toString()).emit("deployment:queued", {
        deploymentId: deployment._id.toString(),
        projectId: project._id.toString(),
        commitHash: deployment.commitHash,
        branch: deployment.branch,
        status: "queued",
        currentStage: "queued",
        triggerType: deployment.triggerType,
        pusher: deployment.pusher,
        commitMessage: deployment.commitMessage,
        createdAt: deployment.createdAt,
      });
    } catch (ioError) {
      logger.warn(`[Queue Service] Failed to emit WebSocket queued event: ${ioError.message}`);
    }

  } catch (error) {
    logger.error(`[Queue Service] Failed to add job to BullMQ: ${error.message}`);
    
    // If queueing fails, mark the deployment record as failed immediately
    deployment.status = "failed";
    deployment.currentStage = "failed";
    deployment.failureReason = error.message;
    deployment.logs.push({
      timestamp: new Date(),
      message: `System Error: Failed to add job to build queue. ${error.message}`,
      stage: "queued",
    });
    await deployment.save();

    project.status = "failed";
    await project.save();

    throw error;
  }
};

module.exports = {
  triggerDeploymentJob,
};
