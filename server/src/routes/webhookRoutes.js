const express = require("express");
const { handleGithubWebhook } = require("../controllers/webhookController");

const router = express.Router();

// POST /api/webhooks/github - Public endpoint for receiving GitHub push webhooks
router.post("/github", handleGithubWebhook);

module.exports = router;
