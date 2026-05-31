import API from "./axios";

/**
 * Fetch local system health metrics.
 */
export const getSystemMetrics = async () => {
  const response = await API.get("/metrics/system");
  return response.data;
};

/**
 * Fetch status of all Docker containers.
 */
export const getContainerMetrics = async () => {
  const response = await API.get("/metrics/containers");
  return response.data;
};

/**
 * Fetch BullMQ job count statistics.
 */
export const getQueueMetrics = async () => {
  const response = await API.get("/metrics/queues");
  return response.data;
};

/**
 * Fetch MongoDB deployment aggregate analytics.
 */
export const getDeploymentMetrics = async () => {
  const response = await API.get("/metrics/deployments");
  return response.data;
};

/**
 * Fetch full dashboard summary overview (system, containers, queues, deployments).
 */
export const getOverviewMetrics = async () => {
  const response = await API.get("/metrics/overview");
  return response.data;
};
