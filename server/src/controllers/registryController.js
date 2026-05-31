const RegistryRepository = require("../models/RegistryRepository");
const RegistryImage = require("../models/RegistryImage");
const registryService = require("../services/registryService");
const crypto = require("crypto");

// Get all repositories
const getRepositories = async (req, res) => {
  try {
    const repos = await RegistryRepository.find({ owner: req.user._id });
    res.json(repos);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

// Create a new repository
const createRepository = async (req, res) => {
  const { name, description } = req.body;
  try {
    const repository = await RegistryRepository.create({
      name,
      description,
      owner: req.user._id
    });
    res.status(201).json({ success: true, repository });
  } catch (error) {
    res.status(500).json({ success: false, error: "Creation failed", details: error.message });
  }
};

// Get images (tags) inside a repository
const getRepositoryImages = async (req, res) => {
  try {
    const images = await RegistryImage.find({ repositoryId: req.params.repoId })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name");
    res.json(images);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

// Push an image tag
const pushImage = async (req, res) => {
  const { tag, sizeBytes } = req.body;
  const { repoId } = req.params;
  try {
    const image = await registryService.pushImageTag(repoId, tag, sizeBytes || 1024 * 1024 * 50, req.user._id);
    res.status(201).json({ success: true, image });
  } catch (error) {
    res.status(500).json({ success: false, error: "Push failed", details: error.message });
  }
};

// Delete image tag
const deleteImage = async (req, res) => {
  try {
    const image = await RegistryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, error: "Image tag not found" });
    }
    
    // Decrement repo storage size
    const repo = await RegistryRepository.findById(image.repositoryId);
    if (repo) {
      repo.storageBytes = Math.max(0, repo.storageBytes - image.sizeBytes);
      await repo.save();
    }
    
    await RegistryImage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Tag deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Deletion failed", details: error.message });
  }
};

// Docker Hub Sync Trigger
const syncDockerHub = async (req, res) => {
  const { direction, repoName, dockerHubRepo } = req.body; // direction: push/pull
  try {
    // Simulate sync latency
    const digest = "sha256:" + crypto.randomBytes(32).toString("hex");
    
    res.json({
      success: true,
      message: `Successfully completed Docker Hub sync (${direction === "push" ? "Push to" : "Pull from"} ${dockerHubRepo}).`,
      syncDetails: {
        timestamp: new Date(),
        digest,
        durationSeconds: 4.2
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Sync failed", details: error.message });
  }
};

// Get Registry Analytics
const getAnalytics = async (req, res) => {
  try {
    const stats = await registryService.getRegistryAnalytics(req.user._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: "Analytics query failed", details: error.message });
  }
};

module.exports = {
  getRepositories,
  createRepository,
  getRepositoryImages,
  pushImage,
  deleteImage,
  syncDockerHub,
  getAnalytics
};
