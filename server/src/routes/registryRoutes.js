const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getRepositories,
  createRepository,
  getRepositoryImages,
  pushImage,
  deleteImage,
  syncDockerHub,
  getAnalytics
} = require("../controllers/registryController");

const router = express.Router();

router.use(protect);

router.get("/repositories", getRepositories);
router.post("/repositories", createRepository);

router.get("/repositories/:repoId/images", getRepositoryImages);
router.post("/repositories/:repoId/images", pushImage);
router.delete("/images/:id", deleteImage);

router.post("/sync", syncDockerHub);
router.get("/analytics", getAnalytics);

module.exports = router;
