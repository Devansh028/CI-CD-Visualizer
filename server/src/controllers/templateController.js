const Template = require("../models/Template");

/**
 * @desc    Get all deployment templates
 * @route   GET /api/templates
 * @access  Private (JWT protected)
 */
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ name: 1 });
    res.json(templates);
  } catch (error) {
    console.error(`Get Templates Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while retrieving templates." });
  }
};

/**
 * @desc    Get a single deployment template by ID
 * @route   GET /api/templates/:id
 * @access  Private (JWT protected)
 */
const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }
    res.json(template);
  } catch (error) {
    console.error(`Get Template By ID Error: ${error.message}`);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Template not found." });
    }
    res.status(500).json({ message: "Server error occurred while retrieving template details." });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
};
