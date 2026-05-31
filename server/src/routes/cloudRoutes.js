const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createConnection,
  getConnections,
  deleteConnection,
  createTarget,
  getTargets,
  deleteTarget,
  getAnalytics
} = require("../controllers/cloudController");

const router = express.Router();

router.use(protect);

router.post("/connections", createConnection);
router.get("/connections", getConnections);
router.delete("/connections/:id", deleteConnection);

router.post("/targets", createTarget);
router.get("/targets", getTargets);
router.delete("/targets/:id", deleteTarget);

router.get("/analytics", getAnalytics);

module.exports = router;
