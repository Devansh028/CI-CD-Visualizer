const CloudConnection = require("../models/CloudConnection");
const DeploymentTarget = require("../models/DeploymentTarget");
const cloudService = require("../services/cloudService");

// Cloud Connections
const createConnection = async (req, res) => {
  const { name, provider, region, credentials } = req.body;
  try {
    const connection = await CloudConnection.create({
      name,
      provider,
      region,
      credentials,
      owner: req.user._id
    });
    res.status(201).json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ success: false, error: "Creation failed", details: error.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const connections = await CloudConnection.find({ owner: req.user._id });
    res.json(connections);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const deleteConnection = async (req, res) => {
  try {
    const connection = await CloudConnection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ success: false, error: "Connection not found." });
    }
    if (connection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this connection." });
    }

    await connection.deleteOne();
    await DeploymentTarget.deleteMany({ cloudConnectionId: req.params.id });
    res.json({ success: true, message: "Connection deleted." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Deletion failed", details: error.message });
  }
};

// Deployment Targets
const createTarget = async (req, res) => {
  const { name, type, cloudConnectionId, metadata } = req.body;
  try {
    const connection = await CloudConnection.findById(cloudConnectionId);
    if (!connection) {
      return res.status(404).json({ success: false, error: "Cloud connection not found." });
    }
    if (connection.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own the parent cloud connection." });
    }

    const target = await DeploymentTarget.create({
      name,
      type,
      cloudConnectionId,
      metadata
    });
    res.status(201).json({ success: true, target });
  } catch (error) {
    res.status(500).json({ success: false, error: "Creation failed", details: error.message });
  }
};

const getTargets = async (req, res) => {
  try {
    const connectionIds = await CloudConnection.find({ owner: req.user._id }).distinct("_id");
    const targets = await DeploymentTarget.find({ cloudConnectionId: { $in: connectionIds } }).populate("cloudConnectionId");
    res.json(targets);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const deleteTarget = async (req, res) => {
  try {
    const target = await DeploymentTarget.findById(req.params.id).populate("cloudConnectionId");
    if (!target) {
      return res.status(404).json({ success: false, error: "Target not found." });
    }
    if (!target.cloudConnectionId || target.cloudConnectionId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own the associated cloud connection." });
    }

    await target.deleteOne();
    res.json({ success: true, message: "Target deleted." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Deletion failed", details: error.message });
  }
};

// Cost & Analytics APIs
const getAnalytics = async (req, res) => {
  const { provider } = req.query;
  try {
    const stats = cloudService.getCloudCostStats(provider || "aws");
    const inventory = cloudService.getCloudResourceExplorer(provider || "aws");
    res.json({
      costAnalytics: stats,
      resourceInventory: inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Analytics query failed", details: error.message });
  }
};

module.exports = {
  createConnection,
  getConnections,
  deleteConnection,
  createTarget,
  getTargets,
  deleteTarget,
  getAnalytics
};
