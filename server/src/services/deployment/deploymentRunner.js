const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");
const { getIO } = require("../../websocket/socket");
const Project = require("../../models/Project");
const Deployment = require("../../models/Deployment");
const DockerImage = require("../../models/DockerImage");
const Log = require("../../models/Log");
const FrameworkProfile = require("../../models/FrameworkProfile");
const { detectFramework } = require("../framework/frameworkDetector");
const { runCommand } = require("../../utils/commandRunner");
const simpleGit = require("simple-git");

// Services
const { buildDockerImage } = require("../docker/dockerImageService");
const { runContainer } = require("../docker/containerService");
const { checkDeploymentHealth } = require("./healthCheckService");
const { setupReverseProxy } = require("../nginx/nginxService");

const Docker = require("dockerode");
const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Parses log strings to determine their severity level.
 */
const getLogLevel = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes("success") || lower.includes("completed successfully") || lower.includes("live") || lower.includes("ready")) return "success";
  if (lower.includes("error") || lower.includes("failed") || lower.includes("exception") || lower.includes("unhealthy")) return "error";
  if (lower.includes("warning") || lower.includes("warn")) return "warning";
  return "info";
};

/**
 * Automatically generates a default Dockerfile based on the detected framework if not present.
 */
const generateDockerfileIfNeeded = (workspacePath, framework, profile, projectPort, onData) => {
  const dockerfilePath = path.join(workspacePath, "Dockerfile");
  if (fs.existsSync(dockerfilePath)) {
    onData("Dockerfile already exists in workspace. Using existing Dockerfile.\n");
    return;
  }

  onData(`Dockerfile not found in workspace. Automatically generating default Dockerfile for ${framework} (Strategy: ${profile.dockerStrategy})...\n`);
  
  let dockerfileContent = "";
  const startCmd = profile.startCommand || "npm start";

  switch (profile.dockerStrategy) {
    case "static-nginx":
      dockerfileContent = `FROM nginx:alpine
COPY dist /usr/share/nginx/html
# Also try copying build if dist is missing
RUN if [ ! -d "dist" ] && [ -d "build" ]; then cp -r build/* /usr/share/nginx/html/; fi
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
      break;

    case "node-server":
      dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE ${projectPort || 3000}
CMD ${JSON.stringify(startCmd.split(" "))}
`;
      break;

    case "python-flask":
    case "python-fastapi":
    case "python-django":
      dockerfileContent = `FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${projectPort || 8000}
CMD ${JSON.stringify(startCmd.split(" "))}
`;
      break;

    case "java-springboot":
      dockerfileContent = `FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN if [ -f "pom.xml" ]; then ./mvnw clean package -DskipTests || mvn clean package -DskipTests; elif [ -f "build.gradle" ]; then ./gradlew build -x test || gradle build -x test; fi
EXPOSE ${projectPort || 8080}
CMD ["sh", "-c", "java -jar build/libs/*.jar || java -jar target/*.jar"]
`;
      break;

    case "go-binary":
      dockerfileContent = `FROM golang:1.20-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY go.sum* ./
RUN go mod download || true
COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE ${projectPort || 8080}
CMD ["./main"]
`;
      break;

    default:
      dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE ${projectPort || 3000}
CMD ${JSON.stringify(startCmd.split(" "))}
`;
  }

  fs.writeFileSync(dockerfilePath, dockerfileContent, "utf8");
  onData("Generated default Dockerfile:\n" + dockerfileContent + "\n");
};

/**
 * Orchestrates the full CI/CD deployment pipeline.
 * Saves live log streams to MongoDB and broadcasts status in real-time.
 */
const runPipeline = async (project, deployment) => {
  console.log("[DEPLOYMENT START]", project._id.toString());
  const io = getIO();
  const workspacePath = path.join("/deployments", project._id.toString(), deployment._id.toString());

  let containerCreatedId = null;
  let logBuffer = "";
  let currentStage = "queued";

  const projectRoom = `project:${project._id}`;
  const deploymentRoom = `deployment:${deployment._id}`;

  const emitStageUpdate = (stage) => {
    const payload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      currentStage: stage,
      status: deployment.status,
      timestamp: new Date()
    };
    io.to(projectRoom).emit("deployment:stage-update", payload);
    io.to(deploymentRoom).emit("deployment:stage-update", payload);
  };

  const appendLog = (message, stage) => {
    logBuffer += message;
  };

  const flushLogs = async () => {
    if (!logBuffer) return;
    const messageToFlush = logBuffer;
    logBuffer = "";

    try {
      const timestamp = new Date();
      const lines = messageToFlush
        .split("\n")
        .filter(l => l.trim() !== "")
        .map(msg => {
          const level = getLogLevel(msg);
          return {
            deploymentId: deployment._id,
            projectId: project._id,
            stage: currentStage,
            message: msg,
            level,
            timestamp,
          };
        });

      if (lines.length > 0) {
        await Log.insertMany(lines);

        const deploymentLogLines = lines.map(line => ({
          timestamp: line.timestamp,
          message: line.message,
          stage: line.stage,
          level: line.level
        }));

        await Deployment.findByIdAndUpdate(deployment._id, {
          $push: { logs: { $each: deploymentLogLines } },
        });

        deployment.logs.push(...deploymentLogLines);

        for (const line of lines) {
          io.to(deploymentRoom).emit("deployment:log", {
            deploymentId: deployment._id.toString(),
            projectId: project._id.toString(),
            stage: line.stage,
            message: line.message,
            level: line.level,
            timestamp: line.timestamp,
          });
        }
      }
    } catch (err) {
      logger.error(`[Runner] Failed to flush logs to DB: ${err.message}`);
    }
  };

  const flusherInterval = setInterval(flushLogs, 1000);

  const logMessage = async (msg) => {
    appendLog(`${msg}\n`, currentStage);
    await flushLogs();
  };

  try {
    // -------------------------------------------------------------
    // STAGE 1: CLONING
    // -------------------------------------------------------------
    currentStage = "cloning";
    deployment.status = "cloning";
    deployment.currentStage = "cloning";
    deployment.repoUrl = project.repoUrl;
    await deployment.save();
    emitStageUpdate(currentStage);

    io.to(projectRoom).emit("deployment:cloning", { deploymentId: deployment._id.toString(), projectId: project._id.toString() });
    io.to(deploymentRoom).emit("deployment:cloning", { deploymentId: deployment._id.toString(), projectId: project._id.toString() });

    console.log("[CLONE REPO]", project.repoUrl);
    await logMessage(`--- STAGE: CLONING START ---`);
    await logMessage(`Cloning repository: ${project.repoUrl} (branch: ${deployment.branch || "main"}) into ${workspacePath}...`);

    if (fs.existsSync(workspacePath)) {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(workspacePath), { recursive: true });

    const cloneStart = Date.now();
    const git = simpleGit();
    await git.clone(project.repoUrl, workspacePath, ["--branch", deployment.branch || "main", "--single-branch"]);
    const cloneTime = (Date.now() - cloneStart) / 1000;

    let realCommitHash = deployment.commitHash;
    try {
      const localGit = simpleGit(workspacePath);
      const log = await localGit.log();
      if (log.latest) {
        realCommitHash = log.latest.hash;
        deployment.commitHash = realCommitHash;
        deployment.commitMessage = log.latest.message;
        deployment.pusher = log.latest.author_name;
      }
    } catch (gitErr) {
      await logMessage(`Warning: Failed to fetch commit details: ${gitErr.message}`);
    }

    deployment.cloneTime = cloneTime;
    deployment.cloneDuration = cloneTime;
    await deployment.save();

    await logMessage(`Cloned successfully in ${cloneTime.toFixed(2)}s.`);
    await logMessage(`--- STAGE: CLONING SUCCESS ---`);

    // -------------------------------------------------------------
    // STAGE 2: BUILDING
    // -------------------------------------------------------------
    currentStage = "building";
    deployment.status = "building";
    deployment.currentStage = "building";
    await deployment.save();
    emitStageUpdate(currentStage);

    io.to(projectRoom).emit("deployment:building", { deploymentId: deployment._id.toString(), projectId: project._id.toString() });
    io.to(deploymentRoom).emit("deployment:building", { deploymentId: deployment._id.toString(), projectId: project._id.toString() });

    console.log("[BUILD START]");
    await logMessage(`--- STAGE: BUILDING START ---`);
    
    // Framework Detection
    const detected = await detectFramework(workspacePath, (msg) => appendLog(msg, currentStage));
    deployment.framework = detected;
    await deployment.save();

    // Fetch Profile
    const profile = await FrameworkProfile.findOne({ framework: detected }) || {
      framework: detected,
      buildCommand: "",
      startCommand: "",
      dockerStrategy: "node-server"
    };

    // Save profile settings to project for reference
    project.framework = detected;
    project.buildCommand = profile.buildCommand;
    project.startCommand = profile.startCommand;
    project.dockerStrategy = profile.dockerStrategy;
    await project.save();

    // Execute Framework specific build
    const buildStart = Date.now();
    if (profile.buildCommand) {
      await logMessage(`Executing build command: "${profile.buildCommand}"`);
      await runCommand(profile.buildCommand, [], { cwd: workspacePath }, (msg) => appendLog(msg, currentStage));
    } else {
      await logMessage(`No build command needed for ${detected}. Skipping build execution.`);
    }
    const buildTime = (Date.now() - buildStart) / 1000;
    
    deployment.buildTime = buildTime;
    await deployment.save();

    await logMessage(`Build completed successfully in ${buildTime.toFixed(2)}s.`);
    await logMessage(`--- STAGE: BUILDING SUCCESS ---`);

    // -------------------------------------------------------------
    // STAGE 3: DOCKERIZING
    // -------------------------------------------------------------
    currentStage = "dockerizing";
    deployment.status = "dockerizing";
    deployment.currentStage = "dockerizing";
    await deployment.save();
    emitStageUpdate(currentStage);

    console.log("[DOCKER BUILD]");
    await logMessage(`--- STAGE: DOCKERIZING START ---`);
    
    // Generate default Dockerfile if not found
    generateDockerfileIfNeeded(workspacePath, detected, profile, project.deployPort, (msg) => appendLog(msg, currentStage));

    const dockerImage = await buildDockerImage(
      project,
      deployment,
      workspacePath,
      (data) => appendLog(data, currentStage)
    );
    
    deployment.dockerImageId = dockerImage._id;
    await deployment.save();
    await logMessage(`--- STAGE: DOCKERIZING SUCCESS ---`);

    // -------------------------------------------------------------
    // STAGE 4: DEPLOYING
    // -------------------------------------------------------------
    currentStage = "deploying";
    deployment.status = "deploying";
    deployment.currentStage = "deploying";
    await deployment.save();
    emitStageUpdate(currentStage);

    console.log("[CONTAINER START]");
    await logMessage(`--- STAGE: DEPLOYING START ---`);

    // 1. Run Container
    await logMessage(`Container Start initiating...`);
    const runResult = await runContainer(
      project,
      dockerImage,
      (data) => appendLog(data, currentStage)
    );

    containerCreatedId = runResult.containerId;
    deployment.containerId = runResult.containerId;
    deployment.containerPort = runResult.containerPort;
    deployment.containerStatus = runResult.containerStatus;
    await deployment.save();
    await logMessage(`Container Start completed successfully.`);

    // 2. Setup Nginx Reverse Proxy
    await logMessage(`Reverse Proxy configuration starting...`);
    await setupReverseProxy(project, deployment, (data) => appendLog(data, currentStage));
    await logMessage(`Reverse Proxy configuration succeeded.`);

    // Emit domain-ready notification
    const domainReadyPayload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      domain: `${project.name.toLowerCase()}.localhost`,
      status: "ready",
      timestamp: new Date()
    };
    io.to(projectRoom).emit("deployment:domain-ready", domainReadyPayload);
    io.to(deploymentRoom).emit("deployment:domain-ready", domainReadyPayload);

    // 3. Health Check
    await logMessage(`Deploy Health Check starting...`);
    await checkDeploymentHealth(project, runResult.containerPort, (data) => appendLog(data, currentStage));
    await logMessage(`Deploy Health Check completed successfully.`);

    // Emit health update event
    const healthPayload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      status: "healthy",
      message: "Container passed HTTP health check.",
      timestamp: new Date()
    };
    io.to(projectRoom).emit("deployment:health-update", healthPayload);
    io.to(deploymentRoom).emit("deployment:health-update", healthPayload);

    // Compute deploy metrics
    const deployTime = (Date.now() - buildStart - (buildTime * 1000)) / 1000;
    deployment.deployTime = deployTime;
    await deployment.save();

    await logMessage(`--- STAGE: DEPLOYING SUCCESS ---`);

    // -------------------------------------------------------------
    // STAGE 5: RUNNING / SUCCESS
    // -------------------------------------------------------------
    currentStage = "running";
    deployment.status = "success";
    deployment.currentStage = "running";
    await deployment.save();
    emitStageUpdate(currentStage);

    clearInterval(flusherInterval);
    await flushLogs();

    const completedAt = new Date();
    const duration = Math.round((completedAt - deployment.startedAt) / 1000);

    deployment.completedAt = completedAt;
    deployment.duration = duration;
    
    const successLog = {
      timestamp: completedAt,
      message: `Pipeline execution completed successfully in ${duration} seconds. Deployment is live.`,
      stage: "running",
    };
    
    await Deployment.findByIdAndUpdate(deployment._id, {
      status: "success",
      currentStage: "running",
      completedAt,
      duration,
      $push: { logs: successLog },
    });
    
    deployment.logs.push(successLog);

    project.status = "deployed";
    await project.save();

    const { logAuditEvent } = require("../../utils/auditLogger");
    await logAuditEvent(project.owner, project.organizationId, "Deployment Success", "Deployment", deployment._id, { projectId: project._id });

    const { createProjectNotification } = require("../notifications/notificationService");
    await createProjectNotification(project._id, {
      type: "deployment-success",
      title: "Deployment Succeeded",
      message: `Deployment version ${deployment.deploymentVersion} for project ${project.name} is successfully online.`,
      severity: "success",
      metadata: { deploymentId: deployment._id, version: deployment.deploymentVersion }
    });

    if (fs.existsSync(workspacePath)) {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    }

    const successPayload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      status: "success",
      completedAt,
      duration,
      containerPort: deployment.containerPort,
    };
    io.to(projectRoom).emit("deployment:success", successPayload);
    io.to(deploymentRoom).emit("deployment:success", successPayload);

    logger.info(`[Runner] Deployment successful: Project ${project.name} | Port ${deployment.containerPort}`);
    console.log("[DEPLOYMENT SUCCESS]");

  } catch (error) {
    logger.error(`[Runner] Pipeline failed: ${error.message}`);
    console.error("[DEPLOYMENT ERROR]", error);
    
    clearInterval(flusherInterval);
    await flushLogs();

    if (fs.existsSync(workspacePath)) {
      try {
        fs.rmSync(workspacePath, { recursive: true, force: true });
      } catch (rmErr) {
        logger.error(`[Runner] Failed to delete temp workspace: ${rmErr.message}`);
      }
    }

    if (containerCreatedId) {
      try {
        logger.info(`[Runner] Cleaning up failed container: ${containerCreatedId}`);
        const container = docker.getContainer(containerCreatedId);
        const inspect = await container.inspect();
        if (inspect.State.Running) {
          await container.stop();
        }
        await container.remove();
      } catch (dockerErr) {
        logger.error(`[Runner] Failed to clean up failed container: ${dockerErr.message}`);
      }
    }

    const completedAt = new Date();
    const duration = Math.round((completedAt - (deployment.startedAt || new Date())) / 1000);

    const failureLog = {
      timestamp: completedAt,
      message: `Pipeline build failed during stage '${currentStage}': ${error.message}`,
      stage: "failed",
    };

    await Deployment.findByIdAndUpdate(deployment._id, {
      status: "failed",
      currentStage: currentStage,
      completedAt,
      duration,
      failureReason: error.message,
      $push: { logs: failureLog },
    });
    
    deployment.status = "failed";
    deployment.currentStage = currentStage;
    deployment.failureReason = error.message;
    deployment.completedAt = completedAt;
    deployment.duration = duration;
    deployment.logs.push(failureLog);

    project.status = "failed";
    await project.save();

    const { logAuditEvent } = require("../../utils/auditLogger");
    await logAuditEvent(project.owner, project.organizationId, "Deployment Failed", "Deployment", deployment._id, { projectId: project._id, stage: currentStage });

    const { createProjectNotification } = require("../notifications/notificationService");
    await createProjectNotification(project._id, {
      type: "deployment-failure",
      title: "Deployment Failed",
      message: `Build run for project ${project.name} failed during stage '${currentStage}': ${error.message}`,
      severity: "error",
      metadata: { deploymentId: deployment._id, stage: currentStage }
    });

    const failedPayload = {
      deploymentId: deployment._id.toString(),
      projectId: project._id.toString(),
      status: "failed",
      completedAt,
      duration,
      failureReason: error.message,
      currentStage,
    };
    io.to(projectRoom).emit("deployment:failed", failedPayload);
    io.to(deploymentRoom).emit("deployment:failed", failedPayload);

    throw error;
  }
};

module.exports = {
  runPipeline,
};
