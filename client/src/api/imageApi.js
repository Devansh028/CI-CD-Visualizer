import API from "./axios";

/**
 * Fetch paginated list of Docker images.
 */
export const getImages = async (page = 1, limit = 10, projectId = null) => {
  const params = { page, limit };
  if (projectId) params.projectId = projectId;
  const response = await API.get("/images", { params });
  return response.data;
};

/**
 * Fetch paginated list of Docker images for a specific project.
 */
export const getProjectImages = async (projectId, page = 1, limit = 10) => {
  const response = await API.get(`/images/project/${projectId}`, {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Inspect Docker image details from daemon.
 */
export const inspectImage = async (id) => {
  const response = await API.get(`/images/${id}`);
  return response.data;
};

/**
 * Trigger redeployment of a specific image version.
 */
export const redeployImage = async (id) => {
  const response = await API.post(`/images/${id}/redeploy`);
  return response.data;
};

/**
 * Delete a specific image.
 */
export const deleteImage = async (id) => {
  const response = await API.delete(`/images/${id}`);
  return response.data;
};
