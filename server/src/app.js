const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const Docker = require("dockerode");
const Redis = require("ioredis");

// Routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const deploymentRoutes = require("./routes/deploymentRoutes");
const domainRoutes = require("./routes/domainRoutes");
const logRoutes = require("./routes/logRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const imageRoutes = require("./routes/imageRoutes");
const environmentRoutes = require("./routes/environmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const frameworkRoutes = require("./routes/frameworkRoutes");
const templateRoutes = require("./routes/templateRoutes");
const orgRoutes = require("./routes/orgRoutes");
const auditRoutes = require("./routes/auditRoutes");
const systemRoutes = require("./routes/systemRoutes");
const k8sRoutes = require("./routes/k8sRoutes");
const cloudRoutes = require("./routes/cloudRoutes");
const iacRoutes = require("./routes/iacRoutes");
const registryRoutes = require("./routes/registryRoutes");
const scalingRoutes = require("./routes/scalingRoutes");
const saasRoutes = require("./routes/saasRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");

// Middleware
const { applySecurityMiddleware } = require("./middleware/securityMiddleware");
const errorHandler = require("./middleware/errorHandler");
const { redisConnection } = require("./config/redis");

const app = express();

// Enable CORS
app.use(cors());

// Capture raw body buffer for cryptographically signing webhook digests
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Apply HTTP security headers, compression, rate limiting, and sanitizers
applySecurityMiddleware(app);

app.use(morgan("dev"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/projects", environmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/frameworks", frameworkRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/k8s", k8sRoutes);
app.use("/api/cloud", cloudRoutes);
app.use("/api/iac", iacRoutes);
app.use("/api/registry", registryRoutes);
app.use("/api/scaling", scalingRoutes);
app.use("/api/saas", saasRoutes);
app.use("/api/dev", publicApiRoutes);

// Health check endpoint verifying DB, Redis, and Docker accessibility
app.get("/health", async (req, res) => {
  const status = {
    status: "ok",
    timestamp: new Date(),
    services: {
      mongo: false,
      redis: false,
      docker: false,
    }
  };

  // 1. Validate Mongoose
  try {
    status.services.mongo = mongoose.connection.readyState === 1;
  } catch (err) {
    status.status = "error";
  }

  // 2. Validate Redis
  let tempRedis = null;
  try {
    tempRedis = new Redis(redisConnection);
    const ping = await tempRedis.ping();
    status.services.redis = ping === "PONG";
  } catch (err) {
    status.status = "error";
  } finally {
    if (tempRedis) {
      tempRedis.disconnect();
    }
  }

  // 3. Validate Docker connection
  try {
    const isWindows = process.platform === "win32";
    const docker = isWindows 
      ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
      : new Docker({ socketPath: "/var/run/docker.sock" });
    await docker.ping();
    status.services.docker = true;
  } catch (err) {
    status.status = "error";
  }

  const statusCode = status.status === "ok" ? 200 : 503;
  res.status(statusCode).json(status);
});

app.get("/", (req, res) => {
  res.json({
    message: "CI/CD Visualizer API running"
  });
});

// Centralized Express Error Boundary
app.use(errorHandler);

module.exports = app;