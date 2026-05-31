const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const { triggerDeploymentJob } = require("../services/deploymentService");
const { deploymentQueue } = require("../queues/deploymentQueue");
const logger = require("../utils/logger");
const { checkDockerStatus, checkGitStatus, checkRepositoryAccess } = require("../utils/integrationChecker");

const verifyDeploymentAccess = async (project, user) => {
  if (project.owner.toString() === user._id.toString()) {
    return true;
  }
  if (project.organizationId) {
    const Member = require("../models/Member");
    const member = await Member.findOne({ organizationId: project.organizationId, userId: user._id });
    if (member) return true;
  }
  return false;
};

/**
 * @desc    Manually trigger a deployment for a project
 * @route   POST /api/deployments/trigger
 * @access  Private (JWT protected)
 */
const triggerManualDeployment = async (req, res) => {
  const { projectId } = req.body;

  try {
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Validation Failure",
        details: "Project ID is required."
      });
    }

    // req.project is pre-populated by checkProjectRole middleware
    const project = req.project;

    // 3. Confirm and validate project configuration
    if (!project.deployPort || project.deployPort < 1 || project.deployPort > 65535) {
      return res.status(400).json({
        success: false,
        error: "Invalid Configuration",
        details: `Deploy port must be a valid number between 1 and 65535. Current: ${project.deployPort || "none"}`
      });
    }

    if (project.dockerStrategy && typeof project.dockerStrategy !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid Configuration",
        details: "Deployment strategy (dockerStrategy) must be a string."
      });
    }

    if (project.buildCommand && typeof project.buildCommand !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid Configuration",
        details: "Build strategy (buildCommand) must be a string."
      });
    }

    // 4. Verify Git CLI and repository access
    const gitInfo = await checkGitStatus();
    if (!gitInfo.installed) {
      return res.status(500).json({
        success: false,
        error: "Git CLI Unavailable",
        details: gitInfo.details
      });
    }

    const repoInfo = await checkRepositoryAccess(project.repoUrl);
    if (!repoInfo.valid) {
      return res.status(400).json({
        success: false,
        error: "Invalid Repository URL",
        details: repoInfo.details
      });
    }
    if (!repoInfo.reachable) {
      return res.status(400).json({
        success: false,
        error: "Git Repository Unreachable",
        details: repoInfo.details
      });
    }

    // 5. Verify Docker daemon availability
    const dockerInfo = await checkDockerStatus();
    if (!dockerInfo.installed) {
      return res.status(500).json({
        success: false,
        error: "Docker Installation Missing",
        details: dockerInfo.details
      });
    }
    if (!dockerInfo.running) {
      return res.status(500).json({
        success: false,
        error: "Docker Daemon Unavailable",
        details: dockerInfo.details
      });
    }

    // 6. Create Deployment record
    const deployment = await Deployment.create({
      projectId: project._id,
      commitHash: `manual-${Math.random().toString(36).substring(2, 10)}`,
      branch: project.branch || "main",
      triggerType: "manual",
      status: "running", // Set initially to running (job will move to queue state in store)
      currentStage: "queued",
      pusher: req.user.name || "System",
      commitMessage: "Manual deployment run triggered via Dashboard",
    });

    // 7. Push build task to BullMQ
    await triggerDeploymentJob(project, deployment);

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, project.organizationId, "Deployment Started", "Deployment", deployment._id, { projectId: project._id });

    res.status(202).json({
      success: true,
      deploymentId: deployment._id,
      status: "running",
      logs: deployment.logs || []
    });
  } catch (error) {
    logger.error(`Manual Trigger Build Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

/**
 * @desc    Retrieve BullMQ queue stats
 * @route   GET /api/deployments/queue
 * @access  Private (JWT protected)
 */
const getQueueStats = async (req, res) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      deploymentQueue.getWaitingCount(),
      deploymentQueue.getActiveCount(),
      deploymentQueue.getCompletedCount(),
      deploymentQueue.getFailedCount(),
      deploymentQueue.getDelayedCount(),
    ]);

    res.json({
      waitingCount: waiting,
      activeCount: active,
      completedCount: completed,
      failedCount: failed,
      delayedCount: delayed,
      queueName: deploymentQueue.name,
    });
  } catch (error) {
    logger.error(`Get Queue Stats Error: ${error.message}`);
    res.status(500).json({ message: "Server error retrieving queue metrics.", error: error.message });
  }
};

/**
 * @desc    Fetch deployment status, current stage, and logs by Deployment ID
 * @route   GET /api/deployments/jobs/:id
 * @access  Private (JWT protected)
 */
const getDeploymentJobDetails = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id).populate("projectId");

    if (!deployment) {
      return res.status(404).json({ message: "Deployment record not found." });
    }

    // Validate project access
    const hasAccess = await verifyDeploymentAccess(deployment.projectId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied. You do not have permission to view this project's deployments." });
    }

    res.json({
      _id: deployment._id,
      projectId: deployment.projectId._id,
      projectName: deployment.projectId.name,
      commitHash: deployment.commitHash,
      branch: deployment.branch,
      status: deployment.status,
      currentStage: deployment.currentStage,
      failureReason: deployment.failureReason || "",
      pusher: deployment.pusher,
      commitMessage: deployment.commitMessage,
      logs: deployment.logs,
      startedAt: deployment.startedAt,
      completedAt: deployment.completedAt,
      duration: deployment.duration,
      containerId: deployment.containerId,
      containerPort: deployment.containerPort,
      containerStatus: deployment.containerStatus,
      dockerImageId: deployment.dockerImageId,
      createdAt: deployment.createdAt,
    });
  } catch (error) {
    logger.error(`Get Deployment Details Error: ${error.message}`);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Deployment record not found." });
    }
    res.status(500).json({ message: "Server error retrieving deployment details." });
  }
};

const getDeploymentLiveStatus = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id).populate("projectId");

    if (!deployment) {
      return res.status(404).json({ message: "Deployment record not found." });
    }

    // Validate project access
    const hasAccess = await verifyDeploymentAccess(deployment.projectId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied. You do not have permission to view this deployment status." });
    }

    res.json({
      _id: deployment._id,
      projectId: deployment.projectId._id,
      projectName: deployment.projectId.name,
      status: deployment.status,
      currentStage: deployment.currentStage,
      failureReason: deployment.failureReason || "",
      containerPort: deployment.containerPort,
      containerStatus: deployment.containerStatus,
      startedAt: deployment.startedAt,
      completedAt: deployment.completedAt,
      duration: deployment.duration,
      createdAt: deployment.createdAt,
    });
  } catch (error) {
    logger.error(`Get Live Status Error: ${error.message}`);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Deployment record not found." });
    }
    res.status(500).json({ message: "Server error retrieving live status." });
  }
};

/**
 * @desc    Fetch all deployments for a project ID
 * @route   GET /api/deployments/project/:projectId
 * @access  Private (JWT protected)
 */
const getProjectDeployments = async (req, res) => {
  try {
    // req.project is pre-populated by checkProjectRole middleware
    const project = req.project;

    const deployments = await Deployment.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 })
      .select("-logs"); // Exclude heavy logs array for list queries

    res.json(deployments);
  } catch (error) {
    logger.error(`Get Project Deployments Error: ${error.message}`);
    res.status(500).json({ message: "Server error retrieving project deployments." });
  }
};

/**
 * @desc    Fetch pipeline stages status and duration metrics by Deployment ID
 * @route   GET /api/deployments/:id/pipeline
 * @access  Private (JWT protected)
 */
const getDeploymentPipeline = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id).populate("projectId");
    if (!deployment) {
      return res.status(404).json({ message: "Deployment record not found." });
    }

    // Validate project access
    const hasAccess = await verifyDeploymentAccess(deployment.projectId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied. You do not have permission to view this pipeline." });
    }

    const order = [
      "cloning",
      "building",
      "dockerizing",
      "deploying",
      "running"
    ];

    const currentStage = deployment.currentStage;
    const deploymentStatus = deployment.status;

    // Parse logs to extract stage start and end times
    const logs = deployment.logs || [];
    const stageTimes = {};

    logs.forEach((log) => {
      const msg = log.message;
      const stage = log.stage;
      const ts = log.timestamp;

      if (!stageTimes[stage]) {
        stageTimes[stage] = { startedAt: ts, completedAt: null };
      } else if (!stageTimes[stage].startedAt || ts < stageTimes[stage].startedAt) {
        stageTimes[stage].startedAt = ts;
      }

      if (msg.includes("SUCCESS ---") || msg.includes("completed successfully") || msg.includes("Pipeline execution completed successfully")) {
        stageTimes[stage].completedAt = ts;
      }
      if (msg.includes("failed during stage") || msg.includes("Pipeline build failed")) {
        stageTimes[stage].completedAt = ts;
      }
    });

    const stages = order.map((stageName) => {
      let status = "pending";
      let startedAt = stageTimes[stageName]?.startedAt || null;
      let completedAt = stageTimes[stageName]?.completedAt || null;

      if (deploymentStatus === "success") {
        status = "success";
      } else if (deploymentStatus === "queued") {
        status = "pending";
      } else if (deploymentStatus === "running" || order.includes(deploymentStatus)) {
        const currentIndex = order.indexOf(currentStage);
        const stageIndex = order.indexOf(stageName);

        if (stageIndex < currentIndex) {
          status = "success";
        } else if (stageIndex === currentIndex) {
          status = "running";
          if (!startedAt) startedAt = new Date();
        } else {
          status = "pending";
        }
      } else if (deploymentStatus === "failed") {
        const currentIndex = order.indexOf(currentStage);
        const stageIndex = order.indexOf(stageName);

        if (stageIndex < currentIndex) {
          status = "success";
        } else if (stageIndex === currentIndex) {
          status = "failed";
          if (!completedAt && deployment.completedAt) completedAt = deployment.completedAt;
        } else {
          status = "skipped";
        }
      }

      let duration = null;
      if (startedAt && completedAt) {
        duration = Math.round((new Date(completedAt) - new Date(startedAt)) / 1000);
      } else if (startedAt && status === "running") {
        duration = Math.round((new Date() - new Date(startedAt)) / 1000);
      }

      return {
        name: stageName,
        status,
        startedAt,
        completedAt,
        duration: duration !== null && duration >= 0 ? duration : null
      };
    });

    res.json({
      deploymentId: deployment._id,
      status: deploymentStatus,
      currentStage,
      failureReason: deployment.failureReason || "",
      stages
    });
  } catch (error) {
    logger.error(`Get Deployment Pipeline Error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching pipeline status." });
  }
};

module.exports = {
  triggerManualDeployment,
  getQueueStats,
  getDeploymentJobDetails,
  getDeploymentLiveStatus,
  getProjectDeployments,
  getDeploymentPipeline,
};
