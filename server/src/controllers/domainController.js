const Domain = require("../models/Domain");
const Project = require("../models/Project");
const { generateNginxConfig, saveNginxConfig, reloadNginx } = require("../services/nginx/nginxService");
const logger = require("../utils/logger");

/**
 * @desc    Fetch all domain configurations for projects owned by user
 * @route   GET /api/domains
 * @access  Private (JWT protected)
 */
const getDomains = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id });
    const projectIds = projects.map(p => p._id);
    const domains = await Domain.find({ projectId: { $in: projectIds } }).populate("projectId");
    res.json(domains);
  } catch (error) {
    logger.error(`Get Domains Error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching domains." });
  }
};

/**
 * @desc    Fetch domains mapped to a specific project
 * @route   GET /api/domains/project/:projectId
 * @access  Private (JWT protected)
 */
const getProjectDomains = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    const domains = await Domain.find({ projectId: project._id });
    res.json(domains);
  } catch (error) {
    logger.error(`Get Project Domains Error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching project domains." });
  }
};

/**
 * @desc    Map a new custom domain or local subdomain to a project
 * @route   POST /api/domains
 * @access  Private (JWT protected)
 */
const createDomain = async (req, res) => {
  const { projectId, domain, subdomain } = req.body;

  try {
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required." });
    }
    if (!domain && !subdomain) {
      return res.status(400).json({ message: "Either a custom domain or a subdomain is required." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    // Duplicate check
    if (subdomain) {
      const sanitizedSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
      const existing = await Domain.findOne({ subdomain: sanitizedSubdomain });
      if (existing) {
        return res.status(400).json({ message: "Subdomain already in use." });
      }
    }
    if (domain) {
      const sanitizedDomain = domain.toLowerCase().trim();
      const existing = await Domain.findOne({ domain: sanitizedDomain });
      if (existing) {
        return res.status(400).json({ message: "Domain already in use." });
      }
    }

    // Identify running container from the latest successful deployment
    const Deployment = require("../models/Deployment");
    const activeDeployment = await Deployment.findOne({ projectId: project._id, status: "success" }).sort({ createdAt: -1 });
    const containerId = activeDeployment ? activeDeployment.containerId : "";
    const targetPort = project.deployPort || 8080;

    const newDomain = await Domain.create({
      projectId: project._id,
      domain: domain ? domain.toLowerCase().trim() : "",
      subdomain: subdomain ? subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") : "",
      targetPort,
      containerId,
      status: "active",
    });

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, project.organizationId, "Domain Added", "Project", project._id, { domain: domain || subdomain });

    // Rebuild configurations and reload Nginx
    const allDomains = await Domain.find({ projectId: project._id, status: "active" });
    const configText = generateNginxConfig(project, allDomains);
    saveNginxConfig(project._id.toString(), configText);

    try {
      await reloadNginx();
    } catch (reloadErr) {
      logger.error(`Failed to reload Nginx during domain creation: ${reloadErr.message}`);
      newDomain.status = "error";
      await newDomain.save();
      return res.status(201).json({
        message: "Domain mapping created, but Nginx reload failed. Config check error.",
        domain: newDomain,
        error: reloadErr.message,
      });
    }

    res.status(201).json({
      message: "Domain mapping created successfully and configuration reloaded.",
      domain: newDomain,
    });
  } catch (error) {
    logger.error(`Create Domain Error: ${error.message}`);
    res.status(500).json({ message: "Server error creating domain mapping." });
  }
};

/**
 * @desc    Delete a mapped project domain/subdomain config
 * @route   DELETE /api/domains/:id
 * @access  Private (JWT protected)
 */
const deleteDomain = async (req, res) => {
  try {
    const domainRecord = await Domain.findById(req.params.id);
    if (!domainRecord) {
      return res.status(404).json({ message: "Domain record not found." });
    }

    const project = await Project.findById(domainRecord.projectId);
    if (!project) {
      return res.status(404).json({ message: "Associated project not found." });
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    // Delete record from DB
    await Domain.findByIdAndDelete(domainRecord._id);

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, project.organizationId, "Domain Removed", "Project", project._id, { domain: domainRecord.domain || domainRecord.subdomain });

    // Rebuild configurations and reload Nginx
    const remainingDomains = await Domain.find({ projectId: project._id, status: "active" });
    const configText = generateNginxConfig(project, remainingDomains);
    saveNginxConfig(project._id.toString(), configText);

    try {
      await reloadNginx();
    } catch (reloadErr) {
      logger.error(`Failed to reload Nginx during domain deletion: ${reloadErr.message}`);
      return res.json({
        message: "Domain mapping deleted from DB, but Nginx reload failed.",
        error: reloadErr.message,
      });
    }

    res.json({ message: "Domain mapping successfully deleted and Nginx configuration reloaded." });
  } catch (error) {
    logger.error(`Delete Domain Error: ${error.message}`);
    res.status(500).json({ message: "Server error deleting domain mapping." });
  }
};

module.exports = {
  getDomains,
  getProjectDomains,
  createDomain,
  deleteDomain,
};
