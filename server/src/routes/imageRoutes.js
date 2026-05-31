const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getImages,
  getProjectImages,
  getInspectImage,
  postRedeployImage,
  deleteDockerImage,
} = require("../controllers/imageController");
const { mongoIdParamValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// Require JWT authentication for all image management routes
router.use(protect);

router.get("/", getImages);
router.get("/project/:projectId", mongoIdParamValidation("projectId"), getProjectImages);
router.get("/:id", mongoIdParamValidation("id"), getInspectImage);
router.post("/:id/redeploy", mongoIdParamValidation("id"), postRedeployImage);
router.delete("/:id", mongoIdParamValidation("id"), deleteDockerImage);

module.exports = router;
