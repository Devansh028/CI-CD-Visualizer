import API from "./axios";

/**
 * Trigger manual deployment pipeline for a project.
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Deployment response details
 */
export const triggerDeployment = async (projectId) => {
  const response = await API.post("/deployments/trigger", { projectId });
  return response.data;
};

/**
 * Retrieve detailed status of a deployment job including logs.
 * @param {string} id - Deployment ID
 * @returns {Promise<Object>} Deployment job details
 */
export const getDeploymentDetails = async (id) => {
  const response = await API.get(`/deployments/jobs/${id}`);
  return response.data;
};

/**
 * Fetch simplified live status for a deployment.
 * @param {string} id - Deployment ID
 * @returns {Promise<Object>} Simplified status details
 */
export const getDeploymentLiveStatus = async (id) => {
  const response = await API.get(`/deployments/${id}/live-status`);
  return response.data;
};

/**
 * Fetch all historical deployments for a project.
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} List of project deployments
 */
export const getProjectDeployments = async (projectId) => {
  const response = await API.get(`/deployments/project/${projectId}`);
  return response.data;
};

/**
 * Fetch historical logs for a deployment ID from database.
 * @param {string} deploymentId - Deployment ID
 * @returns {Promise<Array>} List of log entries
 */
export const getDeploymentLogs = async (deploymentId) => {
  const response = await API.get(`/logs/${deploymentId}`);
  return response.data;
};

/**
 * Fetch detailed pipeline stages and metrics for a deployment.
 * @param {string} id - Deployment ID
 * @returns {Promise<Object>} Pipeline stages payload
 */
export const getPipelineStatus = async (id) => {
  const response = await API.get(`/deployments/${id}/pipeline`);
  return response.data;
};
