import API from "./axios";

/**
 * Fetch all projects belonging to the current user
 * @returns {Promise<Array>} List of projects
 */
export const getProjects = async () => {
  const response = await API.get("/projects");
  return response.data;
};

/**
 * Fetch a single project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object>} Project details
 */
export const getProjectById = async (id) => {
  const response = await API.get(`/projects/${id}`);
  return response.data;
};

/**
 * Create a new project
 * @param {Object} projectData - Project attributes
 * @returns {Promise<Object>} Created project
 */
export const createProject = async (projectData) => {
  const response = await API.post("/projects", projectData);
  return response.data;
};

/**
 * Update an existing project's settings
 * @param {string} id - Project ID
 * @param {Object} projectData - Attributes to update
 * @returns {Promise<Object>} Updated project
 */
export const updateProject = async (id, projectData) => {
  const response = await API.put(`/projects/${id}`, projectData);
  return response.data;
};

/**
 * Delete a project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object>} Deletion confirmation message
 */
export const deleteProject = async (id) => {
  const response = await API.delete(`/projects/${id}`);
  return response.data;
};
