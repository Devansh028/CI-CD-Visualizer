const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const io = require("socket.io-client");
const http = require("http");

const User = require("./src/models/User");
const Project = require("./src/models/Project");
const Deployment = require("./src/models/Deployment");
const { initSocket } = require("./src/websocket/socketServer");
const app = require("./src/app");

const PORT = 5055;
let server;
let socket;

async function run() {
  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cicd_visualizer");
  console.log("Database connected.");

  // Get or create test user
  let user = await User.findOne({ email: "test-websocket@example.com" });
  if (!user) {
    user = await User.create({
      name: "Test Websocket User",
      email: "test-websocket@example.com",
      password: "password123",
      role: "admin"
    });
  }

  // Get or create test project
  let project = await Project.findOne({ name: "Test Socket Project" });
  if (!project) {
    project = await Project.create({
      name: "Test Socket Project",
      description: "A project for testing live websockets logs",
      repoUrl: "https://github.com/octocat/Hello-World.git",
      branch: "master",
      framework: "static",
      deployPort: 8089,
      owner: user._id,
      status: "active"
    });
  }

  // Create mock deployment
  const deployment = await Deployment.create({
    projectId: project._id,
    commitHash: "mock-hash-123",
    branch: "master",
    triggerType: "manual",
    status: "queued",
    currentStage: "queued",
    pusher: user.name,
    commitMessage: "Test deployment run for websockets logs"
  });

  // Sign JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "1h"
  });

  console.log(`Starting temporary test HTTP and Socket.IO server on port ${PORT}`);
  server = http.createServer(app);
  initSocket(server);
  server.listen(PORT);

  console.log("Connecting socket client...");
  socket = io(`http://localhost:${PORT}`, {
    auth: { token },
    reconnection: false
  });

  const events = [];

  return new Promise((resolve, reject) => {
    socket.on("connect", () => {
      console.log(`Socket client connected successfully (ID: ${socket.id}). Joining rooms...`);
      socket.emit("join-deployment", deployment._id.toString());
      socket.emit("join-project", project._id.toString());

      // Trigger mock updates from backend using getIO
      setTimeout(async () => {
        try {
          console.log("Emitting mock logs and stages from backend...");
          const socketIOInstance = require("./src/websocket/socketServer").getIO();
          
          const stagePayload = {
            deploymentId: deployment._id.toString(),
            projectId: project._id.toString(),
            currentStage: "cloning",
            status: "running"
          };
          socketIOInstance.to(`project:${project._id}`).emit("deployment:stage-update", stagePayload);
          socketIOInstance.to(`deployment:${deployment._id}`).emit("deployment:stage-update", stagePayload);

          // Emit log line
          socketIOInstance.to(`deployment:${deployment._id}`).emit("deployment:log", {
            deploymentId: deployment._id.toString(),
            projectId: project._id.toString(),
            stage: "cloning",
            message: "Cloning repository...",
            level: "info",
            timestamp: new Date()
          });

          // Emit success status
          socketIOInstance.to(`project:${project._id}`).emit("deployment:success", {
            deploymentId: deployment._id.toString(),
            projectId: project._id.toString(),
            status: "success",
            containerPort: 8089
          });
        } catch (e) {
          reject(e);
        }
      }, 1500);
    });

    socket.on("connect_error", (err) => {
      reject(new Error(`Socket connection error: ${err.message}`));
    });

    socket.on("deployment:stage-update", (data) => {
      console.log("Received deployment:stage-update event:", data);
      events.push({ event: "stage-update", data });
    });

    socket.on("deployment:log", (data) => {
      console.log("Received deployment:log event:", data);
      events.push({ event: "log", data });
    });

    socket.on("deployment:success", (data) => {
      console.log("Received deployment:success event:", data);
      events.push({ event: "success", data });

      try {
        if (events.length >= 3) {
          console.log("\n============================================");
          console.log("Verification Success! All expected socket events received.");
          console.log("============================================\n");
          resolve();
        } else {
          reject(new Error("Verification failed. Did not receive all expected socket events."));
        }
      } catch (e) {
        reject(e);
      }
    });

    // Timeout safety trigger
    setTimeout(() => {
      reject(new Error("Verification timed out. Expected socket events not received within 10 seconds."));
    }, 10000);
  });
}

run()
  .then(() => {
    console.log("Cleaning up test execution environment...");
    if (socket) socket.close();
    if (server) server.close();
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification error occurred:", err.stack);
    if (socket) socket.close();
    if (server) server.close();
    mongoose.connection.close();
    process.exit(1);
  });
