const express = require("express");
const mongoose = require("mongoose");
const { checkDockerStatus, checkGitStatus } = require("../utils/integrationChecker");

const router = express.Router();

/**
 * @desc    System integration health-check endpoint
 * @route   GET /api/system/health
 * @access  Public
 */
router.get("/health", async (req, res) => {
  const healthStatus = {
    server: "ok",
    docker: "error",
    git: "error",
    database: "error"
  };

  // 1. Verify Database
  try {
    if (mongoose.connection.readyState === 1) {
      healthStatus.database = "ok";
    }
  } catch (dbErr) {
    healthStatus.database = "error";
  }

  // 2. Verify Docker
  try {
    const dockerInfo = await checkDockerStatus();
    if (dockerInfo.installed && dockerInfo.running) {
      healthStatus.docker = "ok";
    }
  } catch (dockerErr) {
    healthStatus.docker = "error";
  }

  // 3. Verify Git
  try {
    const gitInfo = await checkGitStatus();
    if (gitInfo.installed) {
      healthStatus.git = "ok";
    }
  } catch (gitErr) {
    healthStatus.git = "error";
  }

  // Determine global status code. If any core dependency fails, return 503 Service Unavailable, but still return the json status payload.
  const isHealthy = Object.values(healthStatus).every(val => val === "ok");
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json(healthStatus);
});

module.exports = router;
