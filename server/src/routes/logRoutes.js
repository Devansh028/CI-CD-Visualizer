const express = require("express");
const { getDeploymentLogs } = require("../controllers/logController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes within this router
router.use(protect);

// GET /api/logs/:deploymentId - Fetch logs
router.get("/:deploymentId", getDeploymentLogs);

module.exports = router;
