import API from "./axios";

/**
 * Fetch all supported frameworks and their profiles
 * @returns {Promise<Array>} List of framework profiles
 */
export const getFrameworks = async () => {
  const response = await API.get("/frameworks");
  return response.data;
};

/**
 * Detect framework from a repo URL or project ID
 * @param {Object} data - Contains repoUrl, branch, or projectId
 * @returns {Promise<Object>} Detected framework coordinates
 */
export const detectFramework = async (data) => {
  const response = await API.post("/frameworks/detect", data);
  return response.data;
};
