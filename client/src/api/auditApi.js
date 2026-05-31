import API from "./axios";

/**
 * Fetch system audit logs with optional filters
 * @param {Object} [params] - Filtering parameters (userId, action, resourceId, startDate, endDate, organizationId)
 * @returns {Promise<Object>} Object containing logs list and pagination info
 */
export const getAuditLogs = async (params = {}) => {
  const response = await API.get("/audit", { params });
  return response.data;
};
