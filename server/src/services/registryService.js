const RegistryRepository = require("../models/RegistryRepository");
const RegistryImage = require("../models/RegistryImage");
const crypto = require("crypto");

/**
 * Pushes a new tag image to a repository, generating a mock digest and calculating tag metadata.
 */
const pushImageTag = async (repositoryId, tag, sizeBytes, userId) => {
  const digest = "sha256:" + crypto.randomBytes(32).toString("hex");
  
  // 1. Create image record
  const image = await RegistryImage.create({
    repositoryId,
    tag,
    digest,
    sizeBytes,
    uploadedBy: userId
  });

  // 2. Increment storage bytes in repository
  const repo = await RegistryRepository.findById(repositoryId);
  if (repo) {
    repo.storageBytes += sizeBytes;
    await repo.save();
  }

  return image;
};

/**
 * Returns storage utilization, downloads, and image growth metrics.
 */
const getRegistryAnalytics = async (userId) => {
  const repos = await RegistryRepository.find({ owner: userId });
  const repoIds = repos.map(r => r._id);
  
  const totalStorage = repos.reduce((sum, r) => sum + r.storageBytes, 0);
  const totalPulls = repos.reduce((sum, r) => sum + r.pullCount, 0);
  
  const images = await RegistryImage.find({ repositoryId: { $in: repoIds } });
  
  // Group by day for the last 7 days to simulate a chart
  const growthStats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    // Sum size of all images uploaded before this date
    const cutoff = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const size = images
      .filter(img => new Date(img.createdAt) <= cutoff)
      .reduce((sum, img) => sum + img.sizeBytes, 0);
      
    // If no real images exist yet, push simulated increments
    const mockIncrement = (1024 * 1024 * 100) * (7 - i); // ~100MB per day
    growthStats.push({
      label,
      sizeMb: Number(((size > 0 ? size : mockIncrement) / 1024 / 1024).toFixed(2))
    });
  }

  return {
    totalRepositories: repos.length,
    totalStorageMb: Number((totalStorage / 1024 / 1024).toFixed(2)) || 250.0,
    totalPulls: totalPulls || 120,
    growthStats
  };
};

module.exports = {
  pushImageTag,
  getRegistryAnalytics
};
