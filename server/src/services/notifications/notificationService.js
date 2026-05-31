const Notification = require("../../models/Notification");
const Project = require("../../models/Project");
const { getIO } = require("../../websocket/socket");
const logger = require("../../utils/logger");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Sends external channel alerts (Email, Slack, Discord) if configured.
 */
const sendExternalAlerts = async (userId, projectId, { title, message, severity, metadata }) => {
  let slackWebhook = process.env.SLACK_WEBHOOK_URL;
  let discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  let alertEmail = process.env.ALERT_EMAIL;

  // Retrieve project-specific webhook settings from environment variables if present
  if (projectId) {
    try {
      const EnvironmentVariable = require("../../models/EnvironmentVariable");
      const { decrypt } = require("../../utils/crypto");
      const projectVars = await EnvironmentVariable.find({ projectId }).lean();

      const slackVar = projectVars.find(v => v.key === "SLACK_WEBHOOK_URL");
      if (slackVar) {
        slackWebhook = slackVar.isSecret ? decrypt(slackVar.encryptedValue) : slackVar.value;
      }

      const discordVar = projectVars.find(v => v.key === "DISCORD_WEBHOOK_URL");
      if (discordVar) {
        discordWebhook = discordVar.isSecret ? decrypt(discordVar.encryptedValue) : discordVar.value;
      }

      const emailVar = projectVars.find(v => v.key === "ALERT_EMAIL");
      if (emailVar) {
        alertEmail = emailVar.isSecret ? decrypt(emailVar.encryptedValue) : emailVar.value;
      }
    } catch (dbErr) {
      logger.warn(`[Notification Channel] Could not fetch project env variables for webhooks: ${dbErr.message}`);
    }
  }

  // 1. Dispatch Slack Webhook Alert
  if (slackWebhook && slackWebhook.startsWith("http")) {
    try {
      await axios.post(slackWebhook, {
        text: `*${title}* (${severity.toUpperCase()})\n${message}\nMetadata: ${JSON.stringify(metadata || {})}`
      });
      logger.info(`[Notification Channel] Slack webhook alert triggered for '${title}'.`);
    } catch (slackErr) {
      logger.error(`[Notification Channel] Slack webhook delivery failed: ${slackErr.message}`);
    }
  }

  // 2. Dispatch Discord Webhook Alert
  if (discordWebhook && discordWebhook.startsWith("http")) {
    try {
      await axios.post(discordWebhook, {
        content: `**${title}** (${severity.toUpperCase()})\n${message}\nMetadata: \`${JSON.stringify(metadata || {})}\``
      });
      logger.info(`[Notification Channel] Discord webhook alert triggered for '${title}'.`);
    } catch (discordErr) {
      logger.error(`[Notification Channel] Discord webhook delivery failed: ${discordErr.message}`);
    }
  }

  // 3. Dispatch Email Alert (simulated via write to server-side mail log)
  if (alertEmail) {
    try {
      const emailContent = `[EMAIL SENT TO ${alertEmail} at ${new Date().toISOString()}]
Subject: ${title} (${severity.toUpperCase()})
Message: ${message}
Metadata: ${JSON.stringify(metadata || {})}
--------------------------------------------------------------------------------\n`;
      fs.appendFileSync(path.join(__dirname, "../../../mail-alerts.log"), emailContent);
      logger.info(`[Notification Channel] Simulated email alert recorded for '${alertEmail}'.`);
    } catch (mailErr) {
      logger.error(`[Notification Channel] Failed to write simulated email alert: ${mailErr.message}`);
    }
  }
};

/**
 * Creates a notification in Mongoose, triggers web alerts, and pushes a Socket.IO event.
 * Automatically prevents duplicate alerts for the same user, project, and type within 5 minutes.
 * 
 * @param {string} userId - Target Mongoose User ID
 * @param {string} projectId - Associated Mongoose Project ID (optional)
 * @param {Object} data - Contains type, title, message, severity, metadata
 */
const createNotification = async (userId, projectId, { type, title, message, severity, metadata }) => {
  try {
    // Deduplication check: limit same type, project, and user alerts within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await Notification.findOne({
      userId,
      projectId,
      type,
      title,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (duplicate) {
      logger.info(`[Notification Service] Duplicate alert skipped. Type: ${type}, Title: ${title}`);
      return duplicate;
    }

    const notification = await Notification.create({
      userId,
      projectId,
      type,
      title,
      message,
      severity,
      metadata: metadata || {},
    });

    // Send notifications to Socket.IO clients
    try {
      const io = getIO();
      const payload = {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        isRead: notification.isRead,
        projectId: notification.projectId,
        createdAt: notification.createdAt,
      };
      
      // Emit to the user's authenticated room
      io.to(`user:${userId}`).emit("notification:new", payload);
    } catch (wsErr) {
      logger.warn(`Failed to push notification via WebSocket: ${wsErr.message}`);
    }

    // Trigger external notification integrations (Slack, Discord, Email)
    await sendExternalAlerts(userId, projectId, { title, message, severity, metadata });

    return notification;
  } catch (err) {
    logger.error(`Error saving notification to DB: ${err.message}`);
    throw err;
  }
};

/**
 * Resolves project owner and triggers a notification.
 * Useful for asynchronous webhook/BullMQ worker background events.
 */
const createProjectNotification = async (projectId, data) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      logger.warn(`Could not dispatch project notification. Project ${projectId} not found.`);
      return null;
    }
    return await createNotification(project.owner, projectId, data);
  } catch (err) {
    logger.error(`Error sending project notification: ${err.message}`);
    return null;
  }
};

module.exports = {
  createNotification,
  createProjectNotification,
};
