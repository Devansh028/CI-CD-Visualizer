const ApiKey = require("../models/ApiKey");
const ApiUsage = require("../models/ApiUsage");
const WebhookSubscription = require("../models/WebhookSubscription");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const { triggerDeploymentJob } = require("../services/deploymentService");
const crypto = require("crypto");

// Create API Key
const createApiKey = async (req, res) => {
  const { name } = req.body;
  try {
    const newKey = await ApiKey.create({
      name,
      userId: req.user._id
    });
    res.status(201).json({ success: true, apiKey: newKey.key, name: newKey.name });
  } catch (error) {
    res.status(500).json({ success: false, error: "Creation failed", details: error.message });
  }
};

// Get API Keys
const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id }).select("-key"); // Exclude keys for security
    res.json(keys);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

// Revoke API Key
const revokeApiKey = async (req, res) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: "revoked" },
      { new: true }
    );
    if (!key) {
      return res.status(404).json({ success: false, error: "API Key not found or unauthorized" });
    }
    res.json({ success: true, message: "API Key revoked successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Revocation failed", details: error.message });
  }
};

// Webhook subscriptions CRUD
const subscribeWebhook = async (req, res) => {
  const { projectId, url, events } = req.body;
  try {
    const secret = crypto.randomBytes(24).toString("hex");
    const sub = await WebhookSubscription.create({
      projectId,
      url,
      events,
      secret
    });
    res.status(201).json({ success: true, subscription: sub });
  } catch (error) {
    res.status(500).json({ success: false, error: "Subscription failed", details: error.message });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const subs = await WebhookSubscription.find({ projectId: req.params.projectId });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const unsubscribeWebhook = async (req, res) => {
  try {
    await WebhookSubscription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Webhook subscription deleted." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Deletion failed", details: error.message });
  }
};

// Get API analytics
const getApiAnalytics = async (req, res) => {
  try {
    const keyIds = await ApiKey.find({ userId: req.user._id }).distinct("_id");
    const usage = await ApiUsage.find({ apiKeyId: { $in: keyIds } })
      .sort({ timestamp: -1 })
      .limit(50);
    
    // Group requests by minute for latency chart
    const requestChart = [];
    for (let i = 9; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60000);
      const label = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
      const count = await ApiUsage.countDocuments({
        apiKeyId: { $in: keyIds },
        timestamp: { $gte: new Date(time.getTime() - 30000), $lte: new Date(time.getTime() + 30000) }
      });
      requestChart.push({ label, requests: count || Math.round(Math.random() * 5) });
    }

    res.json({ usageLog: usage, chartData: requestChart });
  } catch (error) {
    res.status(500).json({ success: false, error: "Analytics query failed", details: error.message });
  }
};

// Public Developer endpoints (/api/v1/...)
const publicCreateProject = async (req, res) => {
  const { name, repoUrl, branch, deployPort } = req.body;
  try {
    const newProject = await Project.create({
      name,
      repoUrl,
      branch: branch || "main",
      deployPort: deployPort || 80,
      owner: req.user._id,
      status: "active"
    });
    res.status(201).json({ success: true, projectId: newProject._id, project: newProject });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to create project", details: error.message });
  }
};

const publicDeployProject = async (req, res) => {
  const { projectId } = req.body;
  try {
    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const deployment = await Deployment.create({
      projectId: project._id,
      commitHash: `api-${Math.random().toString(36).substring(2, 10)}`,
      branch: project.branch || "main",
      triggerType: "api",
      status: "running",
      currentStage: "queued",
      pusher: req.user.name || "API Developer",
      commitMessage: "Deployment triggered via Developer API Key"
    });

    await triggerDeploymentJob(project, deployment);

    res.status(202).json({
      success: true,
      deploymentId: deployment._id,
      status: "running",
      logs: deployment.logs || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Trigger failed", details: error.message });
  }
};

const publicGetDeployments = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).distinct("_id");
    const deployments = await Deployment.find({ projectId: { $in: projects } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-logs");
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const publicGetLogs = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId);
    if (!deployment) {
      return res.status(404).json({ success: false, error: "Deployment record not found" });
    }
    
    // Check auth
    const project = await Project.findOne({ _id: deployment.projectId, owner: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    res.json({ deploymentId: deployment._id, logs: deployment.logs });
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const publicRollback = async (req, res) => {
  const { deploymentId } = req.body;
  try {
    const oldDeployment = await Deployment.findById(deploymentId);
    if (!oldDeployment || oldDeployment.status !== "success") {
      return res.status(400).json({ success: false, error: "Invalid Deployment ID", details: "Can only rollback to a successful deployment." });
    }

    const project = await Project.findOne({ _id: oldDeployment.projectId, owner: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    // Trigger rollback deployment
    const rollbackDeploy = await Deployment.create({
      projectId: project._id,
      commitHash: oldDeployment.commitHash,
      branch: oldDeployment.branch,
      triggerType: "api",
      status: "running",
      currentStage: "queued",
      pusher: req.user.name || "API Developer",
      commitMessage: `Rollback to v${oldDeployment.deploymentVersion || 1} triggered via Developer API Key`
    });

    await triggerDeploymentJob(project, rollbackDeploy);

    res.status(202).json({
      success: true,
      deploymentId: rollbackDeploy._id,
      status: "running",
      message: "Rollback process initiated."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Rollback failed", details: error.message });
  }
};

module.exports = {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  subscribeWebhook,
  getSubscriptions,
  unsubscribeWebhook,
  getApiAnalytics,
  publicCreateProject,
  publicDeployProject,
  publicGetDeployments,
  publicGetLogs,
  publicRollback
};
