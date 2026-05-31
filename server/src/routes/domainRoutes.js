const express = require("express");
const {
  getDomains,
  getProjectDomains,
  createDomain,
  deleteDomain,
} = require("../controllers/domainController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes within this router
router.use(protect);

// GET /api/domains - Get all domains owned by user
// POST /api/domains - Create a new domain mapping
router.route("/")
  .get(getDomains)
  .post(createDomain);

// GET /api/domains/project/:projectId - Get domains mapped to a project
router.get("/project/:projectId", getProjectDomains);

// DELETE /api/domains/:id - Delete a domain mapping
router.delete("/:id", deleteDomain);

module.exports = router;
