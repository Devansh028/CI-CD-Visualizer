const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { checkProjectRole } = require("../middleware/rbacMiddleware");
const { projectValidation, mongoIdParamValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// Protect all routes within this router
router.use(protect);

// Routes mapping:
// POST /api/projects - Create a new project
// GET  /api/projects - Get all user's projects
router.route("/")
  .post(projectValidation, createProject)
  .get(getProjects);

// GET    /api/projects/:id - Get project details
// PUT    /api/projects/:id - Update project settings
// DELETE /api/projects/:id - Delete project
router.route("/:id")
  .get(
    mongoIdParamValidation("id"),
    checkProjectRole(["owner", "admin", "developer", "viewer"]),
    getProjectById
  )
  .put(
    mongoIdParamValidation("id"),
    checkProjectRole(["owner", "admin", "developer"]),
    projectValidation,
    updateProject
  )
  .delete(
    mongoIdParamValidation("id"),
    checkProjectRole(["owner", "admin"]),
    deleteProject
  );

module.exports = router;

