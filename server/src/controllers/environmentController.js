const {
  getVariables,
  addVariable,
  updateVariable,
  deleteVariable,
} = require("../services/environment/environmentService");
const logger = require("../utils/logger");

/**
 * @desc    Get all environment variables for a project (secrets masked)
 * @route   GET /api/projects/:projectId/env
 * @access  Private (JWT protected)
 */
const getProjectVariables = async (req, res) => {
  try {
    const list = await getVariables(req.params.projectId, req.user._id);
    res.json(list);
  } catch (error) {
    logger.error(`Get Env Variables Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Failed to retrieve environment variables." });
  }
};

/**
 * @desc    Add a new environment variable to a project (encrypt secrets)
 * @route   POST /api/projects/:projectId/env
 * @access  Private (JWT protected)
 */
const postProjectVariable = async (req, res) => {
  const { key, value, isSecret } = req.body;
  try {
    const variable = await addVariable(
      req.params.projectId,
      key,
      value,
      isSecret === true || isSecret === "true",
      req.user._id
    );

    const { logAuditEvent } = require("../utils/auditLogger");
    const action = (isSecret === true || isSecret === "true") ? "Secret Created" : "Environment Updated";
    await logAuditEvent(req.user._id, null, action, "Project", req.params.projectId, { key });

    res.status(201).json(variable);
  } catch (error) {
    logger.error(`Create Env Variable Error: ${error.message}`);
    res.status(400).json({ message: error.message || "Failed to create environment variable." });
  }
};

/**
 * @desc    Update an existing environment variable
 * @route   PUT /api/projects/:projectId/env/:envId
 * @access  Private (JWT protected)
 */
const putProjectVariable = async (req, res) => {
  const { key, value, isSecret } = req.body;
  try {
    const variable = await updateVariable(
      req.params.projectId,
      req.params.envId,
      key,
      value,
      isSecret === true || isSecret === "true",
      req.user._id
    );

    const { logAuditEvent } = require("../utils/auditLogger");
    const action = (isSecret === true || isSecret === "true") ? "Secret Created" : "Environment Updated";
    await logAuditEvent(req.user._id, null, action, "Project", req.params.projectId, { key });

    res.json(variable);
  } catch (error) {
    logger.error(`Update Env Variable Error: ${error.message}`);
    res.status(400).json({ message: error.message || "Failed to update environment variable." });
  }
};

/**
 * @desc    Delete an environment variable from a project
 * @route   DELETE /api/projects/:projectId/env/:envId
 * @access  Private (JWT protected)
 */
const deleteProjectVariable = async (req, res) => {
  try {
    const result = await deleteVariable(req.params.projectId, req.params.envId, req.user._id);

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, null, "Environment Updated", "Project", req.params.projectId, { deletedEnvId: req.params.envId });

    res.json(result);
  } catch (error) {
    logger.error(`Delete Env Variable Error: ${error.message}`);
    res.status(500).json({ message: error.message || "Failed to delete environment variable." });
  }
};

module.exports = {
  getProjectVariables,
  postProjectVariable,
  putProjectVariable,
  deleteProjectVariable,
};
