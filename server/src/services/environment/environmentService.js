const EnvironmentVariable = require("../../models/EnvironmentVariable");
const Project = require("../../models/Project");
const { encrypt, decrypt } = require("../../utils/crypto");
const logger = require("../../utils/logger");
const { getIO = () => {} } = require("../../websocket/socket");

const verifyEnvAccess = async (project, userId) => {
  if (project.owner.toString() === userId.toString()) {
    return true;
  }
  if (project.organizationId) {
    const Member = require("../../models/Member");
    const member = await Member.findOne({ organizationId: project.organizationId, userId });
    if (member) return true;
  }
  return false;
};

/**
 * Validates environment key formatting.
 */
const validateKey = (key) => {
  const reg = /^[A-Z_][A-Z0-9_]*$/;
  return reg.test(key);
};

/**
 * Mask secret string for UI presentation.
 */
const maskSecret = (val) => {
  return "***********";
};

/**
 * Scopes variables to the project, masking secrets to ensure security.
 */
const getVariables = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }
  const hasAccess = await verifyEnvAccess(project, userId);
  if (!hasAccess) {
    throw new Error("Access denied. You do not have permission to view this project's environment variables.");
  }

  const variables = await EnvironmentVariable.find({ projectId }).lean();
  
  // Mask sensitive values before delivering to frontend
  return variables.map(v => ({
    _id: v._id,
    projectId: v.projectId,
    key: v.key,
    value: v.isSecret ? maskSecret(v.value) : v.value,
    isSecret: v.isSecret,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));
};

/**
 * Creates a new environment variable.
 */
const addVariable = async (projectId, key, value, isSecret, userId) => {
  const cleanKey = key.trim().toUpperCase();
  if (!validateKey(cleanKey)) {
    throw new Error("Invalid key formatting. Keys must be alphanumeric and underscores only, and cannot start with a number.");
  }
  if (!value) {
    throw new Error("Variable value is required.");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }
  const hasAccess = await verifyEnvAccess(project, userId);
  if (!hasAccess) {
    throw new Error("Access denied. You do not have permission to modify this project's environment variables.");
  }

  // Check for duplicates
  const existing = await EnvironmentVariable.findOne({ projectId, key: cleanKey });
  if (existing) {
    throw new Error(`Environment variable with key '${cleanKey}' already exists in this project.`);
  }

  let encryptedValue = null;
  let storedValue = value;

  if (isSecret) {
    encryptedValue = encrypt(value);
    storedValue = maskSecret(value);
  }

  const variable = await EnvironmentVariable.create({
    projectId,
    key: cleanKey,
    value: storedValue,
    encryptedValue,
    isSecret,
    createdBy: userId,
  });

  // Emit WebSocket event
  const io = getIO();
  io.to(`project:${projectId}`).emit("environment:created", {
    variableId: variable._id,
    projectId,
    key: variable.key,
    isSecret: variable.isSecret,
  });

  return {
    _id: variable._id,
    projectId,
    key: variable.key,
    value: variable.value,
    isSecret: variable.isSecret,
  };
};

/**
 * Updates an existing environment variable.
 */
const updateVariable = async (projectId, envId, key, value, isSecret, userId) => {
  const cleanKey = key.trim().toUpperCase();
  if (!validateKey(cleanKey)) {
    throw new Error("Invalid key formatting.");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }
  const hasAccess = await verifyEnvAccess(project, userId);
  if (!hasAccess) {
    throw new Error("Access denied. You do not have permission to update this project's environment variables.");
  }

  const variable = await EnvironmentVariable.findById(envId);
  if (!variable || variable.projectId.toString() !== projectId.toString()) {
    throw new Error("Environment variable not found.");
  }

  // Check for duplicate key if name is changing
  if (variable.key !== cleanKey) {
    const existing = await EnvironmentVariable.findOne({ projectId, key: cleanKey });
    if (existing) {
      throw new Error(`Environment variable with key '${cleanKey}' already exists.`);
    }
    variable.key = cleanKey;
  }

  // Check if value has changed
  if (value && value !== maskSecret("")) {
    if (isSecret) {
      variable.encryptedValue = encrypt(value);
      variable.value = maskSecret(value);
    } else {
      variable.encryptedValue = null;
      variable.value = value;
    }
  } else if (variable.isSecret !== isSecret) {
    // If secrecy type changed but no new value is provided, we must throw or keep it.
    // If changing from secret to public without value, we need a new value.
    if (!isSecret) {
      throw new Error("A new plain-text value must be provided when converting a secret variable to public.");
    } else {
      // Converting public to secret: encrypt existing value
      variable.encryptedValue = encrypt(variable.value);
      variable.value = maskSecret(variable.value);
    }
  }

  variable.isSecret = isSecret;
  await variable.save();

  // Emit WebSocket event
  const io = getIO();
  io.to(`project:${projectId}`).emit("environment:updated", {
    variableId: variable._id,
    projectId,
    key: variable.key,
    isSecret: variable.isSecret,
  });

  return {
    _id: variable._id,
    projectId,
    key: variable.key,
    value: variable.value,
    isSecret: variable.isSecret,
  };
};

/**
 * Removes an environment variable.
 */
const deleteVariable = async (projectId, envId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }
  const hasAccess = await verifyEnvAccess(project, userId);
  if (!hasAccess) {
    throw new Error("Access denied. You do not have permission to delete this project's environment variables.");
  }

  const variable = await EnvironmentVariable.findById(envId);
  if (!variable || variable.projectId.toString() !== projectId.toString()) {
    throw new Error("Environment variable not found.");
  }

  const key = variable.key;
  await variable.deleteOne();

  // Emit WebSocket event
  const io = getIO();
  io.to(`project:${projectId}`).emit("environment:deleted", {
    variableId: envId,
    projectId,
    key,
  });

  return { message: "Environment variable deleted successfully." };
};

module.exports = {
  getVariables,
  addVariable,
  updateVariable,
  deleteVariable,
};
