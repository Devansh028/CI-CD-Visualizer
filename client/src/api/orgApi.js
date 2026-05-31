import API from "./axios";

// Organizations CRUD
export const createOrg = async (data) => {
  const response = await API.post("/organizations", data);
  return response.data;
};

export const getMyOrgs = async () => {
  const response = await API.get("/organizations");
  return response.data;
};

export const getOrgById = async (orgId) => {
  const response = await API.get(`/organizations/${orgId}`);
  return response.data;
};

export const updateOrg = async (orgId, data) => {
  const response = await API.put(`/organizations/${orgId}`, data);
  return response.data;
};

export const deleteOrg = async (orgId) => {
  const response = await API.delete(`/organizations/${orgId}`);
  return response.data;
};

// Teams CRUD & Assignments
export const createTeam = async (orgId, data) => {
  const response = await API.post(`/organizations/${orgId}/teams`, data);
  return response.data;
};

export const assignProjectsToTeam = async (teamId, projectIds) => {
  const response = await API.put(`/organizations/teams/${teamId}`, { projectIds });
  return response.data;
};

export const manageTeamMembers = async (teamId, memberIds) => {
  const response = await API.post(`/organizations/teams/${teamId}/members`, { memberIds });
  return response.data;
};

export const deleteTeam = async (teamId) => {
  const response = await API.delete(`/organizations/teams/${teamId}`);
  return response.data;
};

// Members CRUD
export const updateMemberRole = async (orgId, userId, role) => {
  const response = await API.put(`/organizations/${orgId}/members/${userId}`, { role });
  return response.data;
};

export const removeMember = async (orgId, userId) => {
  const response = await API.delete(`/organizations/${orgId}/members/${userId}`);
  return response.data;
};

// Invitations CRUD
export const inviteMember = async (orgId, data) => {
  const response = await API.post(`/organizations/${orgId}/invitations`, data);
  return response.data;
};

export const getInvitations = async (orgId) => {
  const response = await API.get(`/organizations/${orgId}/invitations`);
  return response.data;
};

export const acceptInvitation = async (token) => {
  const response = await API.post("/organizations/invitations/accept", { token });
  return response.data;
};

export const revokeInvitation = async (inviteId) => {
  const response = await API.delete(`/organizations/invitations/${inviteId}`);
  return response.data;
};
