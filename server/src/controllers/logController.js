const Log = require("../models/Log");
const Deployment = require("../models/Deployment");
const logger = require("../utils/logger");

/**
 * @desc    Fetch all historical logs for a deployment ID
 * @route   GET /api/logs/:deploymentId
 * @access  Private (JWT protected)
 */
const getDeploymentLogs = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId).populate("projectId");
    if (!deployment) {
      return res.status(404).json({ message: "Deployment record not found." });
    }
    if (deployment.projectId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    const logs = await Log.find({ deploymentId: req.params.deploymentId }).sort({ timestamp: 1 });
    res.json(logs);
  } catch (error) {
    logger.error(`Get Logs Error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching logs." });
  }
};

module.exports = {
  getDeploymentLogs,
};
