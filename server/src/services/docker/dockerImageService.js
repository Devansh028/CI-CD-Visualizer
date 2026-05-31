const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const { runCommand } = require("../../utils/commandRunner");
const DockerImage = require("../../models/DockerImage");
const Deployment = require("../../models/Deployment");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Packages the workspace and builds a Docker image.
 * Streams build logs in real-time.
 * 
 * @param {Object} project - The Project mongoose document
 * @param {Object} deployment - The Deployment mongoose document
 * @param {string} workspacePath - Cloned project path
 * @param {Function} onData - Log callback
 * @returns {Promise<Object>} - The created DockerImage mongoose document
 */
const buildDockerImage = async (project, deployment, workspacePath, onData) => {
  const imageName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  
  // Count successful deployments to generate sequential version tags (v1, v2, etc.)
  const successfulCount = await Deployment.countDocuments({ projectId: project._id, status: "success" });
  const tag = `v${successfulCount + 1}`;
  
  const tarPath = `/tmp/${deployment._id}.tar.gz`;
  
  // 1. Ensure Dockerfile exists in the workspace
  let dockerfile = project.dockerfilePath || "Dockerfile";
  if (dockerfile.startsWith("./")) {
    dockerfile = dockerfile.substring(2);
  }
  
  const dockerfileFullPath = path.join(workspacePath, dockerfile);
  if (!fs.existsSync(dockerfileFullPath)) {
    throw new Error(`Dockerfile not found at target path: ${project.dockerfilePath}`);
  }
  
  onData(`Packaging build context into tar archive (excluding .git and node_modules)...\n`);
  
  // Create /tmp directory if it doesn't exist
  if (!fs.existsSync("/tmp")) {
    fs.mkdirSync("/tmp", { recursive: true });
  }

  // Compress workspace excluding node_modules and .git
  await runCommand(
    "tar",
    ["-czf", tarPath, "--exclude=.git", "--exclude=node_modules", "-C", workspacePath, "."],
    {},
    onData
  );

  onData(`Triggering Docker image build: ${imageName}:${tag}...\n`);

  const stream = await docker.buildImage(fs.createReadStream(tarPath), {
    t: `${imageName}:${tag}`,
    dockerfile: dockerfile,
  });

  // 2. Stream build progress output from Docker daemon
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, onFinished, onProgress);

    function onFinished(err, output) {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    }

    function onProgress(event) {
      if (event.stream) {
        onData(event.stream);
      } else if (event.error) {
        onData(`\nDocker build error: ${event.error}\n`);
      }
    }
  });

  // Cleanup tar archive
  if (fs.existsSync(tarPath)) {
    fs.unlinkSync(tarPath);
  }

  onData(`Docker build completed. Inspecting image details...\n`);

  // 3. Inspect image metadata
  const image = docker.getImage(`${imageName}:${tag}`);
  const imageInfo = await image.inspect();

  // 4. Save to Database
  const dockerImage = await DockerImage.create({
    imageName,
    tag,
    imageId: imageInfo.Id,
    size: imageInfo.Size,
    projectId: project._id,
  });

  onData(`Registered Docker Image in DB. ID: ${imageInfo.Id.substring(0, 19)} | Size: ${(imageInfo.Size / 1024 / 1024).toFixed(2)} MB\n`);

  return dockerImage;
};

module.exports = {
  buildDockerImage,
};
