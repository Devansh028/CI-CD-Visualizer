const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const http = require("http");

const User = require("./src/models/User");
const Project = require("./src/models/Project");
const Deployment = require("./src/models/Deployment");
const app = require("./src/app");

const PORT = 5059;
let server;

async function run() {
  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cicd_visualizer");
  console.log("Database connected.");

  // Get test user
  const user = await User.findOne({ email: "test-websocket@example.com" });
  if (!user) {
    throw new Error("Test user not found. Please run verify_websockets.js first.");
  }

  // Create a mock completed deployment
  const project = await Project.findOne({ owner: user._id });
  if (!project) {
    throw new Error("Test project not found. Please run verify_websockets.js first.");
  }

  // Create a mock deployment with logs to test parser
  const deployment = await Deployment.create({
    projectId: project._id,
    commitHash: "pipeline-test-hash",
    branch: "master",
    triggerType: "manual",
    status: "success",
    currentStage: "success",
    pusher: user.name,
    commitMessage: "Test pipeline duration parser",
    logs: [
      { timestamp: new Date(Date.now() - 7000), stage: "cloning", message: "--- STAGE: CLONING START ---" },
      { timestamp: new Date(Date.now() - 6000), stage: "cloning", message: "Cloning repository..." },
      { timestamp: new Date(Date.now() - 5000), stage: "cloning", message: "--- STAGE: CLONING SUCCESS ---" },

      { timestamp: new Date(Date.now() - 5000), stage: "building", message: "--- STAGE: BUILDING START ---" },
      { timestamp: new Date(Date.now() - 3000), stage: "building", message: "Installing npm packages..." },
      { timestamp: new Date(Date.now() - 2000), stage: "building", message: "--- STAGE: BUILDING SUCCESS ---" }
    ],
    startedAt: new Date(Date.now() - 7000),
    completedAt: new Date(),
    duration: 7
  });

  // Sign JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "1h"
  });

  console.log(`Starting temporary test HTTP server on port ${PORT}`);
  server = http.createServer(app);
  server.listen(PORT);

  console.log(`Fetching pipeline status for deployment ${deployment._id}...`);
  const response = await axios.get(`http://localhost:${PORT}/api/deployments/${deployment._id}/pipeline`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const payload = response.data;
  console.log("Received Pipeline Response:", JSON.stringify(payload, null, 2));

  // Assertions
  if (payload.deploymentId !== deployment._id.toString()) {
    throw new Error(`Assertion failed: deploymentId mismatch. Expected ${deployment._id}, got ${payload.deploymentId}`);
  }

  if (payload.status !== "success") {
    throw new Error(`Assertion failed: status mismatch. Expected success, got ${payload.status}`);
  }

  if (payload.stages.length !== 5) {
    throw new Error(`Assertion failed: stages length mismatch. Expected 5 stages, got ${payload.stages.length}`);
  }

  // Validate Cloning duration
  const cloningStage = payload.stages.find(s => s.name === "cloning");
  if (!cloningStage) {
    throw new Error("Assertion failed: cloning stage not found.");
  }
  console.log(`cloning status: ${cloningStage.status}, duration: ${cloningStage.duration}s`);
  if (cloningStage.status !== "success" || cloningStage.duration !== 2) {
    throw new Error(`Assertion failed: cloning values incorrect. Expected success/2s, got ${cloningStage.status}/${cloningStage.duration}s`);
  }

  // Validate Building duration
  const buildingStage = payload.stages.find(s => s.name === "building");
  if (!buildingStage) {
    throw new Error("Assertion failed: building stage not found.");
  }
  console.log(`building status: ${buildingStage.status}, duration: ${buildingStage.duration}s`);
  if (buildingStage.status !== "success" || buildingStage.duration !== 3) {
    throw new Error(`Assertion failed: building values incorrect. Expected success/3s, got ${buildingStage.status}/${buildingStage.duration}s`);
  }

  console.log("\n============================================");
  console.log("Pipeline Visualizer API Verification Success!");
  console.log("============================================\n");
}

run()
  .then(() => {
    if (server) server.close();
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed:", err.message);
    if (server) server.close();
    mongoose.connection.close();
    process.exit(1);
  });
