const Docker = require("dockerode");
const DockerImage = require("../../models/DockerImage");
const Project = require("../../models/Project");
const Deployment = require("../../models/Deployment");
const Log = require("../../models/Log");
const logger = require("../../utils/logger");
const { getIO } = require("../../websocket/socket");

// Services
const { runContainer } = require("./containerService");
const { checkDeploymentHealth } = require("../deployment/healthCheckService");
const { setupReverseProxy } = require("../nginx/nginxService");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Lists user's project Docker images with pagination.
 */
const listImages = async (userId, page = 1, limit = 10, projectId = null) => {
  // Get projects owned by the user
  const userProjects = await Project.find({ owner: userId }).select("_id");
  const projectIds = userProjects.map(p => p._id);

  if (projectIds.length === 0) {
    return { images: [], total: 0, page, pages: 0 };
  }

  // Filter queries
  const query = {
    projectId: { $in: projectIds },
    status: { $ne: "deleted" },
  };

  if (projectId) {
    // Make sure user owns this specific project
    if (!projectIds.some(id => id.toString() === projectId.toString())) {
      throw new Error("Access denied. You do not own this project.");
    }
    query.projectId = projectId;
  }

  const skip = (page - 1) * limit;
  const total = await DockerImage.countDocuments(query);
  const images = await DockerImage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("projectId", "name branch framework")
    .lean();

  return {
    images,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Inspect image metadata directly from Docker daemon.
 */
const inspectImage = async (imageId, userId) => {
  const imageMeta = await DockerImage.findById(imageId);
  if (!imageMeta || imageMeta.status === "deleted") {
    throw new Error("Docker image not found in database.");
  }

  // Ownership verification
  const project = await Project.findById(imageMeta.projectId);
  if (!project || project.owner.toString() !== userId.toString()) {
    throw new Error("Access denied. You do not own this project.");
  }

  try {
    const dockerImage = docker.getImage(imageMeta.dockerImageId || imageMeta.imageId);
    const details = await dockerImage.inspect();
    return details;
  } catch (err) {
    logger.error(`Docker daemon inspect failed: ${err.message}`);
    throw new Error(`Failed to inspect image on Docker host: ${err.message}`);
  }
};

/**
 * Deletes Docker image from both database metadata and Docker daemon storage.
 */
const deleteImage = async (imageId, userId) => {
  const imageMeta = await DockerImage.findById(imageId);
  if (!imageMeta || imageMeta.status === "deleted") {
    throw new Error("Docker image not found or already deleted.");
  }

  // Ownership verification
  const project = await Project.findById(imageMeta.projectId);
  if (!project || project.owner.toString() !== userId.toString()) {
    throw new Error("Access denied. You do not own this project.");
  }

  // 1. Attempt to remove from local Docker registry
  try {
    const dockerImage = docker.getImage(imageMeta.dockerImageId || imageMeta.imageId);
    // force: true to remove even if it has tags (or is associated with containers, though we should warn)
    await dockerImage.remove({ force: true });
    logger.info(`Docker image ${imageMeta.imageName}:${imageMeta.tag} removed from daemon.`);
  } catch (err) {
    logger.warn(`Docker daemon could not remove image (it may be in use): ${err.message}`);
  }

  // 2. Mark database record as deleted
  imageMeta.status = "deleted";
  await imageMeta.save();

  // 3. Emit real-time WebSockets event
  const io = getIO();
  io.to(`project:${project._id}`).emit("docker:image-deleted", {
    imageId: imageMeta._id,
    projectId: project._id,
    imageName: imageMeta.imageName,
    tag: imageMeta.tag,
  });

  return { message: "Docker image deleted successfully." };
};

/**
 * Background runner that executes the redeployment workflow.
 */
const runRedeploymentPipeline = async (project, image, deployment) => {
  const io = getIO();
  let containerCreatedId = null;
  let logBuffer = "";
  let currentStage = "container-start";

  const getLogLevel = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes("success") || lower.includes("completed successfully") || lower.includes("live") || lower.includes("ready")) return "success";
    if (lower.includes("error") || lower.includes("failed") || lower.includes("exception") || lower.includes("unhealthy")) return "error";
    if (lower.includes("warning") || lower.includes("warn")) return "warning";
    return "info";
  };

  const emitStageUpdate = (stage) => {
    const payload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      currentStage: stage,
      status: deployment.status,
      timestamp: new Date()
    };
    io.to(`project:${project._id}`).emit("deployment:stage-update", payload);
    io.to(`deployment:${deployment._id}`).emit("deployment:stage-update", payload);
  };

  const appendLog = (message, stage) => {
    logBuffer += message;
  };

  const flushLogs = async () => {
    if (!logBuffer) return;
    const messageToFlush = logBuffer;
    logBuffer = "";

    try {
      const timestamp = new Date();
      const lines = messageToFlush
        .split("\n")
        .filter(l => l.trim() !== "")
        .map(msg => {
          const level = getLogLevel(msg);
          return {
            deploymentId: deployment._id,
            projectId: project._id,
            stage: currentStage,
            message: msg,
            level,
            timestamp,
          };
        });

      if (lines.length > 0) {
        await Log.insertMany(lines);
        const logsPayload = lines.map(line => ({
          timestamp: line.timestamp,
          message: line.message,
          stage: line.stage,
          level: line.level
        }));
        await Deployment.findByIdAndUpdate(deployment._id, {
          $push: { logs: { $each: logsPayload } }
        });
        deployment.logs.push(...logsPayload);

        for (const line of lines) {
          io.to(`deployment:${deployment._id}`).emit("deployment:log", {
            deploymentId: deployment._id.toString(),
            projectId: project._id.toString(),
            stage: line.stage,
            message: line.message,
            level: line.level,
            timestamp: line.timestamp,
          });
        }
      }
    } catch (err) {
      logger.error(`[RedeployRunner] Failed to flush logs: ${err.message}`);
    }
  };

  const flusherInterval = setInterval(flushLogs, 1000);

  const logMessage = async (msg) => {
    appendLog(`${msg}\n`, currentStage);
    await flushLogs();
  };

  try {
    await logMessage(`--- REDEPLOYMENT INITIATED ---`);
    await logMessage(`Reusing existing Docker image: ${image.imageName}:${image.tag}`);

    // 1. Stage: container-start
    currentStage = "container-start";
    deployment.currentStage = "container-start";
    await deployment.save();
    emitStageUpdate(currentStage);

    await logMessage(`--- STAGE: CONTAINER-START START ---`);
    const runResult = await runContainer(project, image, (data) => appendLog(data, currentStage));
    containerCreatedId = runResult.containerId;
    deployment.containerId = runResult.containerId;
    deployment.containerPort = runResult.containerPort;
    deployment.containerStatus = runResult.containerStatus;
    await deployment.save();
    await logMessage(`--- STAGE: CONTAINER-START SUCCESS ---`);

    // 2. Stage: reverse-proxy-setup
    currentStage = "reverse-proxy-setup";
    deployment.currentStage = "reverse-proxy-setup";
    await deployment.save();
    emitStageUpdate(currentStage);

    await logMessage(`--- STAGE: REVERSE-PROXY-SETUP START ---`);
    await setupReverseProxy(project, deployment, (data) => appendLog(data, currentStage));
    await logMessage(`--- STAGE: REVERSE-PROXY-SETUP SUCCESS ---`);

    // Emit domain-ready
    const domainUrl = `${project.name.toLowerCase()}.localhost`;
    io.to(`project:${project._id}`).emit("deployment:domain-ready", {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      domain: domainUrl,
      status: "ready",
      timestamp: new Date()
    });

    // 3. Stage: health-check
    currentStage = "health-check";
    deployment.currentStage = "health-check";
    await deployment.save();
    emitStageUpdate(currentStage);

    await logMessage(`--- STAGE: HEALTH-CHECK START ---`);
    await checkDeploymentHealth(project, runResult.containerPort, (data) => appendLog(data, currentStage));
    await logMessage(`--- STAGE: HEALTH-CHECK SUCCESS ---`);

    // 4. Redeployment Completed Successfully
    clearInterval(flusherInterval);
    await flushLogs();

    const completedAt = new Date();
    const duration = Math.round((completedAt - deployment.startedAt) / 1000);

    deployment.status = "success";
    deployment.currentStage = "success";
    deployment.completedAt = completedAt;
    deployment.duration = duration;
    
    const successMsg = {
      timestamp: completedAt,
      message: `Image redeployed successfully in ${duration} seconds. Container is online.`,
      stage: "success"
    };
    await Deployment.findByIdAndUpdate(deployment._id, {
      status: "success",
      currentStage: "success",
      completedAt,
      duration,
      $push: { logs: successMsg }
    });
    deployment.logs.push(successMsg);

    project.status = "deployed";
    await project.save();

    // Emit socket success notifications
    const successPayload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      status: "success",
      completedAt,
      duration,
      containerPort: deployment.containerPort,
    };
    io.to(`project:${project._id}`).emit("deployment:success", successPayload);
    io.to(`deployment:${deployment._id}`).emit("deployment:success", successPayload);

    // Emit custom image redeployed socket event
    io.to(`project:${project._id}`).emit("docker:image-redeployed", {
      imageId: image._id,
      projectId: project._id,
      deploymentId: deployment._id,
      version: image.tag,
    });

    // Dispatch success notification
    const { createProjectNotification } = require("../notifications/notificationService");
    await createProjectNotification(project._id, {
      type: "docker-image-redeployed",
      title: "Image Redeployed",
      message: `Image version ${image.tag} for project ${project.name} has been successfully redeployed.`,
      severity: "success",
      metadata: { imageId: image._id, tag: image.tag, deploymentId: deployment._id }
    });

    logger.info(`[RedeployRunner] Image redeployment successful: Project ${project.name} | Port ${deployment.containerPort}`);

    const { logAuditEvent } = require("../../utils/auditLogger");
    await logAuditEvent(project.owner, project.organizationId, "Rollback Success", "Deployment", deployment._id, { projectId: project._id, imageId: image._id });

  } catch (error) {
    logger.error(`[RedeployRunner] Redeployment failed: ${error.message}`);
    clearInterval(flusherInterval);
    await flushLogs();

    // Clean up partial container if created
    if (containerCreatedId) {
      try {
        const container = docker.getContainer(containerCreatedId);
        const inspect = await container.inspect();
        if (inspect.State.Running) {
          await container.stop();
        }
        await container.remove();
      } catch (err) {
        // ignore
      }
    }

    const completedAt = new Date();
    const duration = Math.round((completedAt - deployment.startedAt) / 1000);

    const failMsg = {
      timestamp: completedAt,
      message: `Redeployment failed: ${error.message}`,
      stage: "failed"
    };

    await Deployment.findByIdAndUpdate(deployment._id, {
      status: "failed",
      currentStage: currentStage,
      completedAt,
      duration,
      failureReason: error.message,
      $push: { logs: failMsg }
    });

    deployment.status = "failed";
    deployment.currentStage = currentStage;
    deployment.failureReason = error.message;
    deployment.completedAt = completedAt;
    deployment.duration = duration;
    const failPayload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      status: "failed",
      completedAt,
      duration,
      failureReason: error.message,
      currentStage,
    };
    io.to(`project:${project._id}`).emit("deployment:failed", failPayload);
    io.to(`deployment:${deployment._id}`).emit("deployment:failed", failPayload);

    // Dispatch rollback-failure notification to owner
    try {
      const { createProjectNotification } = require("../notifications/notificationService");
      await createProjectNotification(project._id, {
        type: "rollback-failure",
        title: "Redeployment Failed",
        message: `Redeployment of image version ${image.tag} for project ${project.name} failed: ${error.message}`,
        severity: "error",
        metadata: { imageId: image._id, tag: image.tag, deploymentId: deployment._id }
      });
    } catch (notifyErr) {
      logger.error(`[RedeployRunner] Failed to send failure notification: ${notifyErr.message}`);
    }

    const { logAuditEvent } = require("../../utils/auditLogger");
    await logAuditEvent(project.owner, project.organizationId, "Rollback Failed", "Deployment", deployment._id, { projectId: project._id, imageId: image._id, error: error.message });
  }
};

/**
 * Triggers the redeployment pipeline using a pre-existing Docker image.
 */
const redeployImage = async (imageId, userId) => {
  const image = await DockerImage.findById(imageId);
  if (!image || image.status === "deleted") {
    throw new Error("Docker image not found.");
  }

  // Verify Project Owner
  const project = await Project.findById(image.projectId);
  if (!project || project.owner.toString() !== userId.toString()) {
    throw new Error("Access denied. You do not own this project.");
  }

  const lastDeployment = await Deployment.findOne({ projectId: image.projectId }).sort({ createdAt: -1 });

  // Create new Deployment record
  const deployment = await Deployment.create({
    projectId: image.projectId,
    commitHash: lastDeployment?.commitHash || "redeploy",
    branch: lastDeployment?.branch || "main",
    triggerType: "manual",
    status: "running",
    currentStage: "container-start",
    dockerImageId: image._id,
    startedAt: new Date(),
    logs: [],
    pusher: "System",
    commitMessage: `Redeployed Docker Image ${image.imageName}:${image.tag}`,
    imageTag: image.tag,
  });

  // Run the redeployment pipeline asynchronously
  runRedeploymentPipeline(project, image, deployment);

  const { logAuditEvent } = require("../../utils/auditLogger");
  await logAuditEvent(userId, project.organizationId, "Rollback Started", "Deployment", deployment._id, { projectId: project._id, imageId: image._id });

  return deployment;
};

module.exports = {
  listImages,
  inspectImage,
  deleteImage,
  redeployImage,
};
