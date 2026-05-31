import API from "./axios";

/**
 * Fetch masked environment variables list for a project.
 */
export const getEnvVars = async (projectId) => {
  const response = await API.get(`/projects/${projectId}/env`);
  return response.data;
};

/**
 * Create a new environment variable.
 * @param {string} projectId - Associated Project ID
 * @param {Object} envData - Contains key, value, and isSecret
 */
export const addEnvVar = async (projectId, envData) => {
  const response = await API.post(`/projects/${projectId}/env`, envData);
  return response.data;
};

/**
 * Update an existing environment variable.
 * @param {string} projectId - Associated Project ID
 * @param {string} envId - Target variable ID
 * @param {Object} envData - Contains key, value, and isSecret
 */
export const updateEnvVar = async (projectId, envId, envData) => {
  const response = await API.put(`/projects/${projectId}/env/${envId}`, envData);
  return response.data;
};

/**
 * Delete an environment variable from a project.
 */
export const deleteEnvVar = async (projectId, envId) => {
  const response = await API.delete(`/projects/${projectId}/env/${envId}`);
  return response.data;
};
