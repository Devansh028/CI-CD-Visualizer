const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getSystemMetrics,
  getContainerMetrics,
  getQueueMetrics,
  getDeploymentMetrics,
  getOverviewMetrics
} = require("../controllers/metricsController");

const router = express.Router();

// Require JWT authentication for all metrics endpoints
router.use(protect);

router.get("/system", getSystemMetrics);
router.get("/containers", getContainerMetrics);
router.get("/queues", getQueueMetrics);
router.get("/deployments", getDeploymentMetrics);
router.get("/overview", getOverviewMetrics);

module.exports = router;
