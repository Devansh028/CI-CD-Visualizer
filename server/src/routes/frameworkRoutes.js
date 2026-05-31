const express = require("express");
const { getFrameworks, detectProjectFramework } = require("../controllers/frameworkController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Secure all endpoints under this router
router.use(protect);

// GET /api/frameworks - Get list of all framework strategies
router.get("/", getFrameworks);

// POST /api/frameworks/detect - Dynamically analyze repository and detect framework
router.post("/detect", detectProjectFramework);

module.exports = router;
