const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const logger = require("../utils/logger");
const { getIO } = require("../websocket/socket");
const { runPipeline } = require("../services/deployment/deploymentRunner");

/**
 * Initializes and starts the BullMQ worker for deployment tasks.
 * Processes jobs step-by-step, appends live logs to MongoDB, and pushes updates via Socket.IO.
 * 
 * @returns {Object} BullMQ Worker instance
 */
const startDeploymentWorker = () => {
  const worker = new Worker(
    "deployment-queue",
    async (job) => {
      const { projectId, repoUrl, branch, commitHash, triggerType, deploymentId } = job.data;
      
      logger.info(`[Worker] Job ${job.id} picked up for processing. Deployment ID: ${deploymentId}`);

      // 1. Fetch Project and Deployment documents
      const project = await Project.findById(projectId);
      const deployment = await Deployment.findById(deploymentId);

      if (!project || !deployment) {
        throw new Error(`Database lookup failed. Project (${projectId}) or Deployment (${deploymentId}) not found.`);
      }

      const io = getIO();
      const projectRoom = `project:${projectId}`;
      const deploymentRoom = `deployment:${deploymentId}`;

      // 2. Transition state to 'running' and set start timestamp
      deployment.status = "running";
      deployment.currentStage = "code-fetch";
      deployment.startedAt = new Date();
      deployment.logs.push({
        timestamp: new Date(),
        message: `Pipeline execution triggered via ${triggerType}. Initializing Docker builder runner...`,
        stage: "queued",
        level: "info",
      });
      await deployment.save();

      project.status = "building";
      await project.save();

      // Emit deployment:started websocket notification to both rooms
      const startedPayload = {
        deploymentId: deployment._id.toString(),
        projectId: project._id.toString(),
        status: "running",
        startedAt: deployment.startedAt,
      };
      io.to(projectRoom).emit("deployment:started", startedPayload);
      io.to(deploymentRoom).emit("deployment:started", startedPayload);

      // 3. Execute the actual pipeline steps
      await runPipeline(project, deployment);
    },
    {
      connection: redisConnection,
    }
  );

  worker.on("failed", async (job, err) => {
    logger.error(`[Worker] Job ${job ? job.id : "unknown"} failed with exception: ${err.message}`);
    
    if (job && job.data && job.data.projectId) {
      try {
        const { createProjectNotification } = require("../services/notifications/notificationService");
        await createProjectNotification(job.data.projectId, {
          type: "queue-failure",
          title: "Build Queue Failure",
          message: `The build queue worker failed to process build job. Error: ${err.message}`,
          severity: "error",
          metadata: { jobId: job.id, error: err.message, deploymentId: job.data.deploymentId }
        });
      } catch (notifyErr) {
        logger.error(`[Worker] Failed to dispatch queue-failure notification: ${notifyErr.message}`);
      }
    }
  });

  worker.on("error", (err) => {
    logger.error(`[Worker] General worker connection error: ${err.message}`);
  });

  logger.info("BullMQ Worker connected to 'deployment-queue' and ready to process jobs.");
  return worker;
};

module.exports = {
  startDeploymentWorker,
};
