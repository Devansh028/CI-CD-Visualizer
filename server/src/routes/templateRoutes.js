const express = require("express");
const { getTemplates, getTemplateById } = require("../controllers/templateController");
const { protect } = require("../middleware/authMiddleware");
const { mongoIdParamValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// GET /api/templates - Get all templates
router.get("/", getTemplates);

// GET /api/templates/:id - Get a single template details
router.get("/:id", mongoIdParamValidation("id"), getTemplateById);

module.exports = router;
