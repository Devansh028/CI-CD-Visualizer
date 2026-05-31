const express = require("express");
const {
  triggerManualDeployment,
  getQueueStats,
  getDeploymentJobDetails,
  getDeploymentLiveStatus,
  getProjectDeployments,
  getDeploymentPipeline,
} = require("../controllers/deploymentController");
const { protect } = require("../middleware/authMiddleware");
const { checkProjectRole } = require("../middleware/rbacMiddleware");
const { mongoIdParamValidation } = require("../middleware/validationMiddleware");
const { check, validationResult } = require("express-validator");

const router = express.Router();

// Secure all endpoints under this router
router.use(protect);

// POST /api/deployments/trigger - Manually trigger a deployment pipeline
router.post(
  "/trigger", 
  [
    check("projectId").isMongoId().withMessage("Valid Project ID is required"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsgs = errors.array().map(e => e.msg).join(". ");
        return res.status(400).json({ success: false, message: errorMsgs });
      }
      next();
    }
  ], 
  checkProjectRole(["owner", "admin", "developer"]),
  triggerManualDeployment
);

// GET  /api/deployments/queue - Check BullMQ queue stats
router.get("/queue", getQueueStats);

// GET  /api/deployments/project/:projectId - Get all deployments for a project
router.get(
  "/project/:projectId", 
  mongoIdParamValidation("projectId"), 
  checkProjectRole(["owner", "admin", "developer", "viewer"]),
  getProjectDeployments
);

// GET  /api/deployments/jobs/:id - Get deployment log and pipeline progress details
router.get("/jobs/:id", mongoIdParamValidation("id"), getDeploymentJobDetails);

// GET  /api/deployments/:id/live-status - Fetch deployment live status details
router.get("/:id/live-status", mongoIdParamValidation("id"), getDeploymentLiveStatus);

// GET  /api/deployments/:id/pipeline - Fetch pipeline stages status
router.get("/:id/pipeline", mongoIdParamValidation("id"), getDeploymentPipeline);

module.exports = router;

