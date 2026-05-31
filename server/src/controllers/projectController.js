const Project = require("../models/Project");
const Deployment = require("../models/Deployment");

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (JWT protected)
 */
const createProject = async (req, res) => {
  const {
    name,
    description,
    repoUrl,
    branch,
    framework,
    buildCommand,
    startCommand,
    dockerStrategy,
    template,
    dockerfilePath,
    deployPort,
    environmentVariables,
    autoDeploy,
    webhookSecret,
  } = req.body;

  try {
    // Basic validations
    if (!name || !repoUrl || !deployPort) {
      return res.status(400).json({ message: "Name, GitHub repository URL, and deploy port are required." });
    }

    // Create the project document owned by the authenticated user
    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      repoUrl: repoUrl.trim(),
      branch: branch ? branch.trim() : "main",
      framework: framework || "node",
      buildCommand: buildCommand ? buildCommand.trim() : "",
      startCommand: startCommand ? startCommand.trim() : "",
      dockerStrategy: dockerStrategy ? dockerStrategy.trim() : "",
      template: template ? template.trim() : null,
      dockerfilePath: dockerfilePath ? dockerfilePath.trim() : "./Dockerfile",
      deployPort: Number(deployPort),
      environmentVariables: environmentVariables || [],
      owner: req.user._id,
      autoDeploy: autoDeploy === true || autoDeploy === "true",
      webhookSecret: webhookSecret || undefined,
      status: "active",
    });

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, project.organizationId, "Project Created", "Project", project._id, { name: project.name });

    res.status(201).json(project);
  } catch (error) {
    console.error(`Create Project Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while creating project.", error: error.message });
  }
};

/**
 * @desc    Get all projects belonging to the authenticated user or their organizations
 * @route   GET /api/projects
 * @access  Private (JWT protected)
 */
const getProjects = async (req, res) => {
  try {
    const Member = require("../models/Member");
    const memberships = await Member.find({ userId: req.user._id }).lean();
    const orgIds = memberships.map(m => m.organizationId);

    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { organizationId: { $in: orgIds } }
      ]
    }).sort({ createdAt: -1 }).lean();
    
    // Find latest deployment for each project
    const projectsWithLatest = await Promise.all(
      projects.map(async (project) => {
        const latestDeployment = await Deployment.findOne({ projectId: project._id })
          .sort({ createdAt: -1 })
          .select("_id status currentStage");
        return {
          ...project,
          latestDeploymentId: latestDeployment ? latestDeployment._id : null,
          latestDeploymentStatus: latestDeployment ? latestDeployment.status : null,
          latestDeploymentStage: latestDeployment ? latestDeployment.currentStage : null,
        };
      })
    );

    res.json(projectsWithLatest);
  } catch (error) {
    console.error(`Get Projects Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while retrieving projects." });
  }
};

/**
 * @desc    Get a single project details by ID
 * @route   GET /api/projects/:id
 * @access  Private (JWT protected, RBAC checked)
 */
const getProjectById = async (req, res) => {
  try {
    // req.project is pre-populated by checkProjectRole middleware
    const project = req.project.toObject ? req.project.toObject() : req.project;

    // Find latest deployment for the project
    const latestDeployment = await Deployment.findOne({ projectId: project._id })
      .sort({ createdAt: -1 })
      .select("_id status currentStage");

    const projectWithLatest = {
      ...project,
      latestDeploymentId: latestDeployment ? latestDeployment._id : null,
      latestDeploymentStatus: latestDeployment ? latestDeployment.status : null,
      latestDeploymentStage: latestDeployment ? latestDeployment.currentStage : null,
    };

    res.json(projectWithLatest);
  } catch (error) {
    console.error(`Get Project By ID Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while retrieving project details." });
  }
};

/**
 * @desc    Update project settings
 * @route   PUT /api/projects/:id
 * @access  Private (JWT protected, RBAC checked)
 */
const updateProject = async (req, res) => {
  const {
    name,
    description,
    repoUrl,
    branch,
    framework,
    buildCommand,
    startCommand,
    dockerStrategy,
    template,
    dockerfilePath,
    deployPort,
    environmentVariables,
    autoDeploy,
    webhookSecret,
    status,
  } = req.body;

  try {
    // req.project is pre-populated by checkProjectRole middleware
    const project = req.project;

    // Update settings
    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (repoUrl !== undefined) project.repoUrl = repoUrl.trim();
    if (branch !== undefined) project.branch = branch.trim();
    if (framework !== undefined) project.framework = framework;
    if (dockerfilePath !== undefined) project.dockerfilePath = dockerfilePath.trim();
    if (deployPort !== undefined) project.deployPort = Number(deployPort);
    if (environmentVariables !== undefined) project.environmentVariables = environmentVariables;
    if (autoDeploy !== undefined) project.autoDeploy = autoDeploy === true || autoDeploy === "true";
    if (webhookSecret !== undefined) project.webhookSecret = webhookSecret.trim();
    if (status !== undefined) project.status = status;
    if (buildCommand !== undefined) project.buildCommand = buildCommand.trim();
    if (startCommand !== undefined) project.startCommand = startCommand.trim();
    if (dockerStrategy !== undefined) project.dockerStrategy = dockerStrategy.trim();
    if (template !== undefined) project.template = template ? template.trim() : null;

    const updatedProject = await project.save();
    
    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, updatedProject.organizationId, "Project Updated", "Project", updatedProject._id, { name: updatedProject.name });

    res.json(updatedProject);
  } catch (error) {
    console.error(`Update Project Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while updating project.", error: error.message });
  }
};

/**
 * @desc    Delete a project and cascade delete all related documents
 * @route   DELETE /api/projects/:id
 * @access  Private (JWT protected, RBAC checked)
 */
const deleteProject = async (req, res) => {
  try {
    // req.project is pre-populated by checkProjectRole middleware
    const project = req.project;

    const Deployment = require("../models/Deployment");
    const EnvironmentVariable = require("../models/EnvironmentVariable");
    const Domain = require("../models/Domain");
    const Log = require("../models/Log");
    const DockerImage = require("../models/DockerImage");

    // Cascade deletions
    await Deployment.deleteMany({ projectId: project._id });
    await EnvironmentVariable.deleteMany({ projectId: project._id });
    await Domain.deleteMany({ projectId: project._id });
    await Log.deleteMany({ projectId: project._id });
    await DockerImage.deleteMany({ projectId: project._id });

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, project.organizationId, "Project Deleted", "Project", project._id, { name: project.name });

    await project.deleteOne();
    res.json({ message: "Project and all associated resources deleted successfully." });
  } catch (error) {
    console.error(`Delete Project Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while deleting project." });
  }
};


module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
