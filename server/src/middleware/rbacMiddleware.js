const Member = require("../models/Member");
const Project = require("../models/Project");

/**
 * Middleware to check if the user has one of the allowed roles within the requested organization.
 * 
 * @param {string[]} allowedRoles - List of allowed roles (e.g. ['owner', 'admin'])
 */
const checkOrgRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const orgId = req.params.orgId || req.body.orgId || req.query.orgId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: "Organization ID is required." });
      }

      const member = await Member.findOne({ organizationId: orgId, userId: req.user._id });
      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient organization permissions."
        });
      }

      req.orgMember = member;
      next();
    } catch (err) {
      console.error(`checkOrgRole middleware error: ${err.message}`);
      res.status(500).json({ success: false, message: "Internal server error checking organization role." });
    }
  };
};

/**
 * Middleware to check if the user is authorized to perform actions on a project.
 * Automatically checks direct project ownership (for personal projects) or organization roles (for organization projects).
 * Also pre-fetches the project and stores it in `req.project` to avoid double DB queries.
 * 
 * @param {string[]} allowedRoles - List of allowed organization roles if the project is in an organization
 */
const checkProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.projectId || req.query.projectId;
      if (!projectId) {
        return res.status(400).json({ success: false, message: "Project ID is required." });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Project not found." });
      }

      // Check direct personal ownership first
      if (project.owner.toString() === req.user._id.toString()) {
        req.project = project;
        return next();
      }

      // If it belongs to an organization, check the organization membership roles
      if (project.organizationId) {
        const member = await Member.findOne({ organizationId: project.organizationId, userId: req.user._id });
        if (member && allowedRoles.includes(member.role)) {
          req.orgMember = member;
          req.project = project;
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permissions to access this project."
      });
    } catch (err) {
      console.error(`checkProjectRole middleware error: ${err.message}`);
      res.status(500).json({ success: false, message: "Internal server error checking project permissions." });
    }
  };
};

/**
 * Middleware to assert global administrator privileges.
 */
const checkGlobalAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Global administrator privileges required."
  });
};

module.exports = {
  checkOrgRole,
  checkProjectRole,
  checkGlobalAdmin,
};
