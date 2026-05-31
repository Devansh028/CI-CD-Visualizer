const ScalingPolicy = require("../models/ScalingPolicy");
const ScalingEvent = require("../models/ScalingEvent");
const Project = require("../models/Project");
const scalingService = require("../services/scalingService");

const createOrUpdatePolicy = async (req, res) => {
  const { projectId, metricType, minReplicas, maxReplicas, targetThreshold, cooldownPeriod } = req.body;
  try {
    let policy = await ScalingPolicy.findOne({ projectId });
    if (policy) {
      policy.metricType = metricType || policy.metricType;
      policy.minReplicas = minReplicas !== undefined ? minReplicas : policy.minReplicas;
      policy.maxReplicas = maxReplicas !== undefined ? maxReplicas : policy.maxReplicas;
      policy.targetThreshold = targetThreshold !== undefined ? targetThreshold : policy.targetThreshold;
      policy.cooldownPeriod = cooldownPeriod !== undefined ? cooldownPeriod : policy.cooldownPeriod;
      await policy.save();
    } else {
      policy = await ScalingPolicy.create({
        projectId,
        metricType,
        minReplicas,
        maxReplicas,
        targetThreshold,
        cooldownPeriod
      });
    }

    res.json({ success: true, policy });
  } catch (error) {
    res.status(500).json({ success: false, error: "Save policy failed", details: error.message });
  }
};

const getPolicy = async (req, res) => {
  try {
    const policy = await ScalingPolicy.findOne({ projectId: req.params.projectId });
    res.json(policy || {});
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await ScalingEvent.find({ projectId: req.params.projectId })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const getMetrics = async (req, res) => {
  try {
    const metrics = scalingService.getMetricsTelemetry(req.params.projectId);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const getHpaManifest = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const policy = await ScalingPolicy.findOne({ projectId: req.params.projectId });
    if (!project || !policy) {
      return res.status(404).json({ success: false, error: "Project or scaling policy not found" });
    }

    const hpaYaml = scalingService.generateHpaYaml(project.name, policy.minReplicas, policy.maxReplicas, policy.targetThreshold);
    res.json({ hpa: hpaYaml });
  } catch (error) {
    res.status(500).json({ success: false, error: "HPA Generation failed", details: error.message });
  }
};

module.exports = {
  createOrUpdatePolicy,
  getPolicy,
  getEvents,
  getMetrics,
  getHpaManifest
};
