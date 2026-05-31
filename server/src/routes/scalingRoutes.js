const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createOrUpdatePolicy,
  getPolicy,
  getEvents,
  getMetrics,
  getHpaManifest
} = require("../controllers/scalingController");

const router = express.Router();

router.use(protect);

router.post("/policies", createOrUpdatePolicy);
router.get("/project/:projectId/policy", getPolicy);
router.get("/project/:projectId/events", getEvents);
router.get("/project/:projectId/metrics", getMetrics);
router.get("/project/:projectId/hpa", getHpaManifest);

module.exports = router;
