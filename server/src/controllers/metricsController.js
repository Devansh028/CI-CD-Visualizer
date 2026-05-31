const { getSystemStats } = require("../services/monitoring/systemService");
const { getContainerStatsList } = require("../services/monitoring/dockerService");
const { getQueueStats } = require("../services/monitoring/queueService");
const { getDeploymentStats } = require("../services/monitoring/deploymentService");
const logger = require("../utils/logger");

/**
 * @desc    Get local OS system resource metrics
 * @route   GET /api/metrics/system
 * @access  Private (JWT protected)
 */
const getSystemMetrics = async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (error) {
    logger.error(`Get System Metrics Error: ${error.message}`);
    res.status(500).json({ message: "Error retrieving system health metrics." });
  }
};

/**
 * @desc    Get stats for all Docker containers
 * @route   GET /api/metrics/containers
 * @access  Private (JWT protected)
 */
const getContainerMetrics = async (req, res) => {
  try {
    const stats = await getContainerStatsList();
    res.json(stats);
  } catch (error) {
    logger.error(`Get Container Metrics Error: ${error.message}`);
    res.status(500).json({ message: "Error retrieving container health metrics." });
  }
};

/**
 * @desc    Get BullMQ job queues count
 * @route   GET /api/metrics/queues
 * @access  Private (JWT protected)
 */
const getQueueMetrics = async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error(`Get Queue Metrics Error: ${error.message}`);
    res.status(500).json({ message: "Error retrieving queue job counts." });
  }
};

/**
 * @desc    Get MongoDB deployment analytics filtered by user project ownership
 * @route   GET /api/metrics/deployments
 * @access  Private (JWT protected)
 */
const getDeploymentMetrics = async (req, res) => {
  try {
    const stats = await getDeploymentStats(req.user._id);
    res.json(stats);
  } catch (error) {
    logger.error(`Get Deployment Metrics Error: ${error.message}`);
    res.status(500).json({ message: "Error retrieving deployment analytics." });
  }
};

/**
 * @desc    Get combined overview of system, container, queue, and deployment metrics
 * @route   GET /api/metrics/overview
 * @access  Private (JWT protected)
 */
const getOverviewMetrics = async (req, res) => {
  try {
    const [system, containers, queues, deployments] = await Promise.all([
      getSystemStats(),
      getContainerStatsList(),
      getQueueStats(),
      getDeploymentStats(req.user._id)
    ]);
    
    res.json({
      system,
      containers,
      queues,
      deployments
    });
  } catch (error) {
    logger.error(`Get Metrics Overview Error: ${error.message}`);
    res.status(500).json({ message: "Error compiling metrics overview dashboard." });
  }
};

module.exports = {
  getSystemMetrics,
  getContainerMetrics,
  getQueueMetrics,
  getDeploymentMetrics,
  getOverviewMetrics,
};
