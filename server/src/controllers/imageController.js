const {
  listImages,
  inspectImage,
  deleteImage,
  redeployImage,
} = require("../services/docker/imageService");
const logger = require("../utils/logger");

/**
 * @desc    Get all Docker images belonging to the user's projects (paginated)
 * @route   GET /api/images
 * @access  Private (JWT protected)
 */
const getImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const projectId = req.query.projectId || null;
    
    const result = await listImages(req.user._id, page, limit, projectId);
    res.json(result);
  } catch (error) {
    logger.error(`Get Images Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Error retrieving Docker images." });
  }
};

/**
 * @desc    Get all Docker images for a specific project ID (paginated)
 * @route   GET /api/images/project/:projectId
 * @access  Private (JWT protected)
 */
const getProjectImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const result = await listImages(req.user._id, page, limit, req.params.projectId);
    res.json(result);
  } catch (error) {
    logger.error(`Get Project Images Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Error retrieving project Docker images." });
  }
};

/**
 * @desc    Inspect Docker image metadata on daemon
 * @route   GET /api/images/:id
 * @access  Private (JWT protected)
 */
const getInspectImage = async (req, res) => {
  try {
    const details = await inspectImage(req.params.id, req.user._id);
    res.json(details);
  } catch (error) {
    logger.error(`Inspect Image Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Error inspecting Docker image." });
  }
};

/**
 * @desc    Redeploy a previously successfully built Docker image
 * @route   POST /api/images/:id/redeploy
 * @access  Private (JWT protected)
 */
const postRedeployImage = async (req, res) => {
  try {
    const deployment = await redeployImage(req.params.id, req.user._id);
    res.status(202).json({
      message: "Redeployment pipeline started successfully.",
      deploymentId: deployment._id,
    });
  } catch (error) {
    logger.error(`Redeploy Image Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Error starting redeployment process." });
  }
};

/**
 * @desc    Delete Docker image metadata and binary from host registry
 * @route   DELETE /api/images/:id
 * @access  Private (JWT protected)
 */
const deleteDockerImage = async (req, res) => {
  try {
    const result = await deleteImage(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    logger.error(`Delete Image Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Error deleting Docker image." });
  }
};

module.exports = {
  getImages,
  getProjectImages,
  getInspectImage,
  postRedeployImage,
  deleteDockerImage,
};
