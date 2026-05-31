import API from "./axios";

/**
 * Fetches all active domains mapped to user's projects.
 */
export const getDomains = async () => {
  const res = await API.get("/domains");
  return res.data;
};

/**
 * Fetches domains mapped to a specific project.
 */
export const getProjectDomains = async (projectId) => {
  const res = await API.get(`/domains/project/${projectId}`);
  return res.data;
};

/**
 * Creates a new project domain mapping entry.
 * 
 * @param {Object} domainData - Contains { projectId, domain, subdomain }
 */
export const createDomain = async (domainData) => {
  const res = await API.post("/domains", domainData);
  return res.data;
};

/**
 * Deletes a mapped domain mapping.
 */
export const deleteDomain = async (id) => {
  const res = await API.delete(`/domains/${id}`);
  return res.data;
};
