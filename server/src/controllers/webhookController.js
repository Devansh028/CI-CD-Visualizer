const crypto = require("crypto");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const { triggerDeploymentJob } = require("../services/deploymentService");

/**
 * Normalizes git repository URLs for comparison.
 * Strip protocols, subdomains, trailing slashes, and .git extensions.
 * Handles both HTTPS and SSH URLs.
 * 
 * @param {string} url - Git repository URL
 * @returns {string} Normalized repository coordinate
 */
const normalizeUrl = (url) => {
  if (!url) return "";
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^git@github\.com:/, "github.com/")
    .replace(/\.git\/?$/, "")
    .replace(/\/$/, "");
};

/**
 * @desc    Receive GitHub webhook push notification
 * @route   POST /api/webhooks/github
 * @access  Public (Signature validated)
 */
const handleGithubWebhook = async (req, res) => {
  const githubEvent = req.headers["x-github-event"];
  const signature = req.headers["x-hub-signature-256"];

  try {
    // 1. Only process push events
    if (githubEvent !== "push") {
      console.log(`[Webhook Service] Ignored non-push event: ${githubEvent}`);
      return res.status(200).json({ message: `Ignored unsupported event type: ${githubEvent}` });
    }

    const { ref, repository, head_commit, after, pusher } = req.body;

    if (!repository) {
      return res.status(400).json({ message: "Bad Request. Payload is missing repository details." });
    }

    const repoUrl = repository.html_url || repository.clone_url;
    const normalizedPayloadUrl = normalizeUrl(repoUrl);

    // 2. Lookup Project in DB
    const projects = await Project.find();
    const project = projects.find(p => normalizeUrl(p.repoUrl) === normalizedPayloadUrl);

    if (!project) {
      console.log(`[Webhook Service] Rejected push. No project matches repository: ${repoUrl}`);
      return res.status(404).json({ message: `No project registered with repository URL: ${repoUrl}` });
    }

    // 3. Verify Signature
    if (!signature) {
      return res.status(401).json({ message: "Signature verification failed. X-Hub-Signature-256 header missing." });
    }

    // Secret validation: Project secret -> Env secret -> local fallback
    const secret = project.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET || "supersecret";
    const hmac = crypto.createHmac("sha256", secret);
    
    // Fallback to JSON.stringify if rawBody is not captured
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const calculatedSignature = "sha256=" + hmac.update(rawBody).digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const calculatedSignatureBuffer = Buffer.from(calculatedSignature);

    // Avoid timingSafeEqual crash by comparing lengths first
    if (
      signatureBuffer.length !== calculatedSignatureBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, calculatedSignatureBuffer)
    ) {
      console.log(`[Webhook Service] Signature mismatch for project: ${project.name}`);
      return res.status(401).json({ message: "Signature verification failed. Invalid payload digest." });
    }

    // 4. Validate Auto Deploy configuration
    if (!project.autoDeploy) {
      console.log(`[Webhook Service] Auto-deploy is disabled for project: ${project.name}`);
      return res.status(200).json({ message: `Push ignored. Auto-deploy is disabled for project: ${project.name}` });
    }

    // 5. Validate pushed branch matches configuration
    const pushedBranch = ref.replace("refs/heads/", "");
    if (pushedBranch !== project.branch) {
      console.log(`[Webhook Service] Ignored push to branch ${pushedBranch}. Expected branch is ${project.branch}`);
      return res.status(200).json({
        message: `Push ignored. Branch '${pushedBranch}' does not match configured deploy branch '${project.branch}'.`
      });
    }

    // 6. Create Deployment metadata record
    const commitHash = head_commit?.id || after || "unknown";
    const commitMessage = head_commit?.message || "Triggered by GitHub push event";
    const pusherName = pusher?.name || pusher?.email || "GitHub Webhook";

    const deployment = await Deployment.create({
      projectId: project._id,
      commitHash,
      branch: pushedBranch,
      triggerType: "webhook",
      status: "queued",
      pusher: pusherName,
      commitMessage,
    });

    console.log(`[Webhook Service] Created deployment metadata entry: ${deployment._id}`);

    // 7. Invoke deployment engine job trigger placeholder
    await triggerDeploymentJob(project, deployment);

    // Dispatch webhook-trigger notification to project owner
    try {
      const { createProjectNotification } = require("../services/notifications/notificationService");
      await createProjectNotification(project._id, {
        type: "webhook-trigger",
        title: "Webhook Trigger Received",
        message: `GitHub webhook push trigger received on branch '${pushedBranch}' for project '${project.name}'. Queuing deployment...`,
        severity: "info",
        metadata: { 
          deploymentId: deployment._id, 
          branch: pushedBranch, 
          commitHash, 
          pusher: pusherName 
        }
      });
    } catch (notifyErr) {
      console.error(`[Webhook Service] Failed to send notification: ${notifyErr.message}`);
    }

    res.status(200).json({
      message: "Push webhook processed successfully. Deployment job queued.",
      deploymentId: deployment._id,
      status: deployment.status,
    });

  } catch (error) {
    console.error(`Webhook Service Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while processing webhook.", error: error.message });
  }
};

module.exports = {
  handleGithubWebhook,
};
