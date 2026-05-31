const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const Deployment = require("../../models/Deployment");
const logger = require("../../utils/logger");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Audit and purge stale Docker resources and workspace files.
 */
const cleanupDockerResources = async () => {
  logger.info("[CleanupService] Initiating periodic cleanup of Docker resources and build workspaces.");
  
  try {
    // 1. Clean Stale Workspaces
    const runningDeployments = await Deployment.find({ 
      status: { $in: ["running", "queued"] } 
    }).select("_id");
    
    const activeIds = new Set(runningDeployments.map(d => d._id.toString()));
    const deploymentsDir = "/tmp/deployments"; 

    if (fs.existsSync(deploymentsDir)) {
      const dirs = fs.readdirSync(deploymentsDir);
      for (const dirName of dirs) {
        if (!activeIds.has(dirName)) {
          const targetPath = path.join(deploymentsDir, dirName);
          try {
            fs.rmSync(targetPath, { recursive: true, force: true });
            logger.info(`[CleanupService] Purged stale build workspace: ${targetPath}`);
          } catch (rmErr) {
            logger.warn(`[CleanupService] Could not remove workspace directory ${targetPath}: ${rmErr.message}`);
          }
        }
      }
    }
    
    // 2. Clean Stopped/Failed/Orphan Containers
    const activeDeployments = await Deployment.find({ 
      status: "success",
      containerId: { $exists: true, $ne: null }
    }).select("containerId");
    
    const activeContainerIds = new Set(
      activeDeployments.map(d => d.containerId)
    );
    
    const containers = await docker.listContainers({ all: true });
    for (const containerInfo of containers) {
      const name = containerInfo.Names[0] ? containerInfo.Names[0].replace(/^\//, "") : "";
      
      // Target only containers managed by the CI/CD Visualizer platform
      if (name.startsWith("cicd-project-")) {
        const fullId = containerInfo.Id;
        
        // Stop and remove if not active, or if exited
        if (!activeContainerIds.has(fullId) || containerInfo.State !== "running") {
          try {
            const container = docker.getContainer(fullId);
            if (containerInfo.State === "running") {
              await container.stop();
            }
            await container.remove({ force: true });
            logger.info(`[CleanupService] Removed orphaned container: ${name} (${fullId.substring(0, 12)})`);
          } catch (cErr) {
            logger.warn(`[CleanupService] Failed to remove container ${name}: ${cErr.message}`);
          }
        }
      }
    }

    // 3. Clean Dangling Docker Images (Images with tag <none>)
    try {
      const pruneResult = await docker.pruneImages({
        filters: {
          dangling: ["true"]
        }
      });
      if (pruneResult && pruneResult.ImagesDeleted) {
        logger.info(`[CleanupService] Pruned dangling images. Count: ${pruneResult.ImagesDeleted.length}`);
      }
    } catch (imgErr) {
      logger.warn(`[CleanupService] Failed to prune dangling images: ${imgErr.message}`);
    }

  } catch (error) {
    logger.error(`[CleanupService] Clean run encountered an error: ${error.message}`);
  }
};

let cleanupInterval = null;

/**
 * Start background execution of the resource cleanup loop.
 * 
 * @param {number} intervalMs - Execution period in milliseconds
 */
const startCleanupInterval = (intervalMs = 6 * 60 * 60 * 1000) => { 
  if (cleanupInterval) return;
  cleanupInterval = setInterval(cleanupDockerResources, intervalMs);
  logger.info(`[CleanupService] Scheduled background cleanup runner every ${intervalMs / 3600000} hours.`);
  
  // Fire once immediately on startup after a brief delay
  setTimeout(cleanupDockerResources, 15000);
};

/**
 * Shut down the cleanup execution loop.
 */
const stopCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info("[CleanupService] Stopped background cleanup runner.");
  }
};

module.exports = {
  cleanupDockerResources,
  startCleanupInterval,
  stopCleanupInterval
};
