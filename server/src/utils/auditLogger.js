const AuditLog = require("../models/AuditLog");
const logger = require("./logger");

/**
 * Log an audit event in the database
 * 
 * @param {string|ObjectId} userId - The user initiating the action
 * @param {string|ObjectId|null} organizationId - The organization context, if any
 * @param {string} action - The action name (e.g. 'Project Created')
 * @param {string} resourceType - The type of resource (e.g. 'Project', 'Secret', 'Domain')
 * @param {string} resourceId - The ID of the resource
 * @param {object} [metadata] - Additional details about the event
 */
const logAuditEvent = async (userId, organizationId, action, resourceType, resourceId, metadata = {}) => {
  try {
    if (!userId) {
      logger.warn(`[AuditLogger] Skipped log for action '${action}' - User ID missing.`);
      return;
    }
    
    await AuditLog.create({
      userId,
      organizationId: organizationId || null,
      action,
      resourceType,
      resourceId: String(resourceId || ""),
      metadata,
    });
  } catch (error) {
    logger.error(`[AuditLogger] Failed to write audit log: ${error.message}`);
  }
};

module.exports = {
  logAuditEvent,
};
