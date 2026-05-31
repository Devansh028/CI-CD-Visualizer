const { getSystemStats } = require("./systemService");
const { getContainerStatsList } = require("./dockerService");
const { getQueueStats } = require("./queueService");
const { getDeploymentStats } = require("./deploymentService");
const logger = require("../../utils/logger");

let pollingInterval = null;

/**
 * Initiates DevOps metrics collection interval.
 * Broadcasts system, queue, and container health, and sends user-scoped deployment analytics.
 * Optimized to run only when active Socket.IO clients are in the "metrics" room.
 * 
 * @param {Object} io - Socket.IO server instance
 */
const startMetricsMonitoring = (io) => {
  if (pollingInterval) return;

  logger.info("Starting background DevOps metrics monitoring system.");

  pollingInterval = setInterval(async () => {
    try {
      // Fetch all sockets connected to the "metrics" room
      const activeSockets = await io.in("metrics").fetchSockets();
      
      // If no clients are actively viewing the dashboard, suspend stats compilation
      if (activeSockets.length === 0) {
        return;
      }

      // Collect global infrastructure metrics
      const systemStats = await getSystemStats();
      const queueStats = await getQueueStats();
      const containerStats = await getContainerStatsList();

      // Check CPU & Memory limits (CPU > 85%, Memory > 90%)
      try {
        const cpuVal = parseInt(systemStats.cpuUsage.replace("%", ""), 10);
        const memVal = parseInt(systemStats.memoryUsage.replace("%", ""), 10);
        
        if (cpuVal > 85 || memVal > 90) {
          const User = require("../../models/User");
          const admins = await User.find({ role: "admin" });
          const targets = admins.length > 0 ? admins : await User.find().limit(1);
          
          const { createNotification } = require("../notifications/notificationService");
          for (const target of targets) {
            await createNotification(target._id, null, {
              type: "high-resource-usage",
              title: "High System Resource Usage",
              message: `Infrastructure Warning: System resources are highly utilized. CPU: ${systemStats.cpuUsage}, Memory: ${systemStats.memoryUsage}.`,
              severity: "warning",
              metadata: { cpu: systemStats.cpuUsage, memory: systemStats.memoryUsage }
            });
          }
        }
      } catch (resourceErr) {
        logger.error(`[Metrics Audit] Resource threshold check failed: ${resourceErr.message}`);
      }

      // Check for unhealthy project containers and trigger warnings
      for (const c of containerStats) {
        if (c.name && c.name.startsWith("cicd-project-") && c.health === "unhealthy") {
          const projectId = c.name.replace("cicd-project-", "");
          try {
            const Project = require("../../models/Project");
            const Notification = require("../../models/Notification");
            const { createProjectNotification } = require("../notifications/notificationService");

            // Avoid alert spamming by checking for existing unread warning alerts
            const existingAlert = await Notification.findOne({
              projectId,
              type: "container-unhealthy",
              isRead: false
            });

            if (!existingAlert) {
              const project = await Project.findById(projectId);
              if (project) {
                await createProjectNotification(projectId, {
                  type: "container-unhealthy",
                  title: "Container Unhealthy",
                  message: `The deployment container for project '${project.name}' is reporting as UNHEALTHY.`,
                  severity: "warning",
                  metadata: { containerId: c.id, status: c.statusText }
                });
              }
            }
          } catch (cErr) {
            logger.error(`[Metrics Audit] Container health notification failure: ${cErr.message}`);
          }
        }
      }

      // Emit global health metrics to all users in the metrics room
      io.to("metrics").emit("metrics:system-update", systemStats);
      io.to("metrics").emit("metrics:queue-update", queueStats);
      io.to("metrics").emit("metrics:container-update", containerStats);

      // Compile and transmit user-scoped deployment analytics individually
      for (const socket of activeSockets) {
        const userId = socket.user?._id || socket.user?.id;
        if (userId) {
          const deploymentStats = await getDeploymentStats(userId);
          socket.emit("metrics:deployment-update", deploymentStats);
        }
      }
    } catch (err) {
      logger.error(`Error compiling live DevOps metrics: ${err.message}`);
    }
  }, 5000); // 5-second polling interval
};

/**
 * Terminates the metrics collection interval.
 */
const stopMetricsMonitoring = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    logger.info("Stopped background DevOps metrics monitoring system.");
  }
};

module.exports = {
  startMetricsMonitoring,
  stopMetricsMonitoring,
};
