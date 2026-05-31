const Project = require("../models/Project");
const FrameworkProfile = require("../models/FrameworkProfile");
const { detectFramework } = require("../services/framework/frameworkDetector");
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

/**
 * @desc    Get all supported frameworks and build strategies
 * @route   GET /api/frameworks
 * @access  Private (JWT protected)
 */
const getFrameworks = async (req, res) => {
  try {
    const profiles = await FrameworkProfile.find().sort({ framework: 1 });
    res.json(profiles);
  } catch (error) {
    logger.error(`Get Frameworks Error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching frameworks profiles.", error: error.message });
  }
};

/**
 * @desc    Clones repository temporarily and detects its framework coordinates
 * @route   POST /api/frameworks/detect
 * @access  Private (JWT protected)
 */
const detectProjectFramework = async (req, res) => {
  const { projectId, repoUrl, branch } = req.body;

  let targetRepoUrl = repoUrl;
  let targetBranch = branch || "main";
  let project = null;

  try {
    if (projectId) {
      project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      targetRepoUrl = project.repoUrl;
      targetBranch = project.branch || "main";
    }

    if (!targetRepoUrl) {
      return res.status(400).json({ message: "repoUrl or projectId is required" });
    }

    // Prepare workspace temporary folder
    const tempDir = path.join("/deployments", "detect-temp", `detect-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    logger.info(`[Framework Detector] Cloning ${targetRepoUrl} (${targetBranch}) for temporary detection...`);
    
    const git = simpleGit();
    await git.clone(targetRepoUrl, tempDir, ["--branch", targetBranch, "--single-branch"]);

    // Run detector logic
    const detected = await detectFramework(tempDir, (msg) => logger.info(`[Framework Detector] ${msg.trim()}`));

    // Clean up temporary workspace
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (rmErr) {
        logger.error(`Failed to clean up temp detection directory: ${rmErr.message}`);
      }
    }

    // Find profile defaults
    const profile = await FrameworkProfile.findOne({ framework: detected });
    const profileData = profile || {
      framework: detected,
      buildCommand: "",
      startCommand: "",
      dockerStrategy: "node-server"
    };

    // If projectId is present, update in DB directly
    if (project) {
      project.framework = detected;
      project.buildCommand = profileData.buildCommand;
      project.startCommand = profileData.startCommand;
      project.dockerStrategy = profileData.dockerStrategy;
      await project.save();
    }

    return res.json({
      success: true,
      framework: detected,
      buildCommand: profileData.buildCommand,
      startCommand: profileData.startCommand,
      dockerStrategy: profileData.dockerStrategy
    });

  } catch (error) {
    logger.error(`Framework detection failed: ${error.message}`);
    return res.status(500).json({ message: "Framework detection failed.", error: error.message });
  }
};

module.exports = {
  getFrameworks,
  detectProjectFramework,
};
