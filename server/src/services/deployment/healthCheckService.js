const Docker = require("dockerode");
const axios = require("axios");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Maps the framework name to its typical health check endpoint pathway.
 */
const getHealthCheckPath = (framework) => {
  const fLower = (framework || "").toLowerCase();
  if (fLower.includes("react") || fLower.includes("vite") || fLower.includes("static") || fLower.includes("nginx")) {
    return "/";
  }
  if (fLower.includes("next")) {
    return "/";
  }
  if (fLower.includes("spring") || fLower.includes("boot")) {
    return "/actuator/health";
  }
  if (fLower.includes("node") || fLower.includes("express") || fLower.includes("nest") || fLower.includes("flask")) {
    return "/health";
  }
  return "/health";
};

/**
 * Pings the deployed application container to check if it is active.
 * Automatically scans container metadata to detect ports and wait for status.
 * Retries up to 10 times with exponential backoffs.
 * 
 * @param {Object} project - The Project mongoose document
 * @param {number} hostPort - The dynamically assigned host port fallback
 * @param {Function} onData - Log callback
 * @returns {Promise<boolean>} - Resolves true if health check passes
 */
const checkDeploymentHealth = async (project, hostPort, onData) => {
  const containerName = `cicd-project-${project._id}`;
  const framework = project.framework || "unknown";
  
  onData(`Initializing deployment health check for framework: ${framework}...\n`);

  const container = docker.getContainer(containerName);
  
  // 1. Wait for container to be running
  onData("Inspecting Docker container status...\n");
  let isRunning = false;
  let containerInfo = null;
  for (let i = 0; i < 5; i++) {
    try {
      containerInfo = await container.inspect();
      if (containerInfo.State.Running) {
        isRunning = true;
        break;
      }
    } catch (err) {
      // container might not be registered yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!isRunning || !containerInfo) {
    onData("Warning: Container is not reported as running by Docker daemon. Proceeding with health checks...\n");
  } else {
    onData(`Container state verified: ${containerInfo.State.Status} (Running: ${containerInfo.State.Running})\n`);
  }

  // 2. Read actual exposed container ports
  let internalPort = project.deployPort || 8080;
  let resolvedHostPort = hostPort;
  
  if (containerInfo && containerInfo.NetworkSettings && containerInfo.NetworkSettings.Ports) {
    const portsObj = containerInfo.NetworkSettings.Ports;
    const portKeys = Object.keys(portsObj);
    if (portKeys.length > 0) {
      // Extract internal port, e.g. "80/tcp" -> 80
      internalPort = parseInt(portKeys[0].split("/")[0], 10);
      
      // Extract host port if mapped
      if (portsObj[portKeys[0]] && portsObj[portKeys[0]].length > 0) {
        resolvedHostPort = parseInt(portsObj[portKeys[0]][0].HostPort, 10);
      }
    }
  }

  onData(`Ports resolved: Internal Container Port = ${internalPort}, External Host Port = ${resolvedHostPort}\n`);

  // 3. Resolve health check endpoints
  const healthPath = getHealthCheckPath(framework);
  
  // If static-nginx is used (React/Vite), it should validate the nginx root page
  const pathsToCheck = [healthPath];
  if (healthPath !== "/") {
    pathsToCheck.push("/"); // fallback to root if framework specific endpoint fails
  }

  // Primary URL: sibling networking (inside Docker network bridge)
  // Secondary URL: localhost (for host-based networking development)
  const urls = [];
  pathsToCheck.forEach(p => {
    urls.push(`http://${containerName}:${internalPort}${p}`);
    urls.push(`http://localhost:${resolvedHostPort}${p}`);
  });

  const maxRetries = 10;
  const timeoutMs = 4000;
  let lastFailureType = "Unknown Error";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    onData(`[Health Check] Attempt ${attempt} of ${maxRetries}...\n`);

    for (const url of urls) {
      try {
        onData(`  Pinging ${url}... `);
        const res = await axios.get(url, {
          timeout: timeoutMs,
          validateStatus: () => true, // Accept any status code to inspect it
        });

        // Consider it a success if status is 2xx or 3xx
        if (res.status >= 200 && res.status < 400) {
          onData(`Success! (HTTP Status: ${res.status})\n`);
          return true;
        } else {
          lastFailureType = `HTTP Status ${res.status}`;
          onData(`Failed (HTTP Status: ${res.status})\n`);
        }
      } catch (err) {
        if (err.code === "ECONNREFUSED") {
          lastFailureType = "Connection Refused";
        } else if (err.code === "ECONNABORTED" || err.message.toLowerCase().includes("timeout")) {
          lastFailureType = "Timeout";
        } else {
          lastFailureType = err.message;
        }
        onData(`Failed (${lastFailureType})\n`);
      }
    }

    if (attempt < maxRetries) {
      // Exponential backoff delay
      const backoffDelay = Math.min(1000 * Math.pow(1.5, attempt - 1), 8000);
      onData(`Waiting ${Math.round(backoffDelay / 1000)} seconds before next attempt...\n`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw new Error(`Health check failed after ${maxRetries} attempts. Reason: ${lastFailureType}`);
};

module.exports = {
  checkDeploymentHealth,
};
