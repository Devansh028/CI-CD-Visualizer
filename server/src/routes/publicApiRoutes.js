const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { protectApiKey } = require("../middleware/apiKeyAuthMiddleware");
const {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  subscribeWebhook,
  getSubscriptions,
  unsubscribeWebhook,
  getApiAnalytics,
  publicCreateProject,
  publicDeployProject,
  publicGetDeployments,
  publicGetLogs,
  publicRollback
} = require("../controllers/publicApiController");

const router = express.Router();

// --------------------------------------------------
// Internal routes: accessed via browser dashboard (JWT auth)
// --------------------------------------------------
router.post("/keys", protect, createApiKey);
router.get("/keys", protect, getApiKeys);
router.delete("/keys/:id", protect, revokeApiKey);

router.post("/webhooks", protect, subscribeWebhook);
router.get("/webhooks/:projectId", protect, getSubscriptions);
router.delete("/webhooks/:id", protect, unsubscribeWebhook);

router.get("/analytics", protect, getApiAnalytics);

// --------------------------------------------------
// Public Developer API: accessed via API Key (x-api-key auth)
// --------------------------------------------------
router.post("/v1/projects", protectApiKey, publicCreateProject);
router.post("/v1/deployments", protectApiKey, publicDeployProject);
router.get("/v1/deployments", protectApiKey, publicGetDeployments);
router.get("/v1/logs/:deploymentId", protectApiKey, publicGetLogs);
router.post("/v1/rollback", protectApiKey, publicRollback);

module.exports = router;
