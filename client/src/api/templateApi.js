import API from "./axios";

/**
 * Fetch all deployment templates
 * @returns {Promise<Array>} List of templates
 */
export const getTemplates = async () => {
  const response = await API.get("/templates");
  return response.data;
};

/**
 * Fetch a single template by ID
 * @param {string} id - Template ID
 * @returns {Promise<Object>} Template details
 */
export const getTemplateById = async (id) => {
  const response = await API.get(`/templates/${id}`);
  return response.data;
};
