const logger = require("../utils/logger");

/**
 * Registers event handlers for an authenticated client socket connection.
 * Supports scoped room subscriptions for deployment logs and project statuses.
 * 
 * @param {Object} socket - The Socket.IO client socket connection
 */
const registerSocketEvents = (socket) => {
  // Join deployment room subscription (for live console logs)
  socket.on("join-deployment", (deploymentId) => {
    const roomName = `deployment:${deploymentId}`;
    socket.join(roomName);
    logger.info(`Socket client ${socket.id} joined room: ${roomName}`);
  });

  // Leave deployment room
  socket.on("leave-deployment", (deploymentId) => {
    const roomName = `deployment:${deploymentId}`;
    socket.leave(roomName);
    logger.info(`Socket client ${socket.id} left room: ${roomName}`);
  });

  // Join project room subscription (for project-level status updates)
  socket.on("join-project", (projectId) => {
    const roomName = `project:${projectId}`;
    socket.join(roomName);
    logger.info(`Socket client ${socket.id} joined room: ${roomName}`);
  });

  // Leave project room
  socket.on("leave-project", (projectId) => {
    const roomName = `project:${projectId}`;
    socket.leave(roomName);
    logger.info(`Socket client ${socket.id} left room: ${roomName}`);
  });

  // Join metrics room subscription
  socket.on("join-metrics", () => {
    socket.join("metrics");
    logger.info(`Socket client ${socket.id} joined room: metrics`);
  });

  // Leave metrics room subscription
  socket.on("leave-metrics", () => {
    socket.leave("metrics");
    logger.info(`Socket client ${socket.id} left room: metrics`);
  });

  // Handle client socket disconnection
  socket.on("disconnect", (reason) => {
    logger.info(`Socket Client Disconnected: ${socket.id} (Reason: ${reason})`);
  });
};

module.exports = {
  registerSocketEvents,
};
