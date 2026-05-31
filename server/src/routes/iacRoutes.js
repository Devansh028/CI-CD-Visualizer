const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  triggerIacOperation,
  getIacExecutions,
  getIacState
} = require("../controllers/iacController");

const router = express.Router();

router.use(protect);

router.post("/trigger", triggerIacOperation);
router.get("/project/:projectId", getIacExecutions);
router.get("/executions/:id/state", getIacState);

module.exports = router;
