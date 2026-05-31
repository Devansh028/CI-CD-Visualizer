const fs = require("fs");
const path = require("path");
const Docker = require("dockerode");
const Domain = require("../../models/Domain");
const logger = require("../../utils/logger");
const { getIO } = require("../../websocket/socket");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

const CONFIGS_DIR = path.join(__dirname, "../../nginx/configs");

/**
 * Generates Nginx configuration block content for a project's domains.
 * 
 * @param {Object} project - The Project mongoose document
 * @param {Array<Object>} domains - Array of Domain mongoose documents
 * @returns {string} - The Nginx server configuration string
 */
const generateNginxConfig = (project, domains) => {
  let config = "";
  const containerName = `cicd-project-${project._id}`;
  const deployPort = project.deployPort || 8080;
  const targetUrl = `http://${containerName}:${deployPort}`;

  for (const d of domains) {
    const serverName = d.domain ? d.domain : `${d.subdomain}.localhost`;

    config += `server {
    listen 80;
    server_name ${serverName};

    location / {
        proxy_pass ${targetUrl};

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\n`;
  }

  return config;
};

/**
 * Saves Nginx configuration file for a project. Deletes the file if domains array is empty.
 * 
 * @param {string} projectId - The Project ID string
 * @param {string} configContent - Nginx configuration string
 */
const saveNginxConfig = (projectId, configContent) => {
  const filePath = path.join(CONFIGS_DIR, `project-${projectId}.conf`);

  if (!configContent) {
    if (fs.existsSync(filePath)) {
      logger.info(`[Nginx Service] Removing domain configuration for project: ${projectId}`);
      fs.unlinkSync(filePath);
    }
    return;
  }

  if (!fs.existsSync(CONFIGS_DIR)) {
    fs.mkdirSync(CONFIGS_DIR, { recursive: true });
  }

  logger.info(`[Nginx Service] Saving config file to: ${filePath}`);
  fs.writeFileSync(filePath, configContent, "utf8");
};

/**
 * Executes 'nginx -t' and 'nginx -s reload' inside the 'cicd-nginx' Docker container.
 */
const reloadNginx = async () => {
  logger.info("[Nginx Service] Initiating Nginx config validation and reload...");
  const container = docker.getContainer("cicd-nginx");

  // 1. Run config check: nginx -t
  const execCheck = await container.exec({
    Cmd: ["nginx", "-t"],
    AttachStdout: true,
    AttachStderr: true,
  });

  const checkStream = await execCheck.start();
  const checkOutput = await new Promise((resolve, reject) => {
    let out = "";
    checkStream.on("data", (chunk) => (out += chunk.toString()));
    checkStream.on("end", () => resolve(out));
    checkStream.on("error", reject);
  });

  const checkStatus = await execCheck.inspect();
  if (checkStatus.ExitCode !== 0) {
    throw new Error(`Nginx config check failed: ${checkOutput}`);
  }

  logger.info("[Nginx Service] Configuration check successful. Reloading service...");

  // 2. Run reload command: nginx -s reload
  const execReload = await container.exec({
    Cmd: ["nginx", "-s", "reload"],
    AttachStdout: true,
    AttachStderr: true,
  });

  const reloadStream = await execReload.start();
  const reloadOutput = await new Promise((resolve, reject) => {
    let out = "";
    reloadStream.on("data", (chunk) => (out += chunk.toString()));
    reloadStream.on("end", () => resolve(out));
    reloadStream.on("error", reject);
  });

  const reloadStatus = await execReload.inspect();
  if (reloadStatus.ExitCode !== 0) {
    throw new Error(`Nginx service reload failed: ${reloadOutput}`);
  }

  logger.info("[Nginx Service] Nginx successfully reloaded.");
};

/**
 * Coordinates Nginx config generation, file saves, and reload executions for a project deployment.
 * 
 * @param {Object} project - The Project mongoose document
 * @param {Object} deployment - The Deployment mongoose document
 * @param {Function} onLog - Pipeline logging callback
 */
const setupReverseProxy = async (project, deployment, onLog) => {
  const io = getIO();
  const projectRoom = project._id.toString();

  onLog("Initializing reverse proxy configuration setup...\n");

  // 1. Retrieve or auto-create project domains
  let domains = await Domain.find({ projectId: project._id });

  if (domains.length === 0) {
    // Generate default subdomain if none exists
    const sanitizedName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 15);
    const shortId = project._id.toString().substring(18);
    const defaultSubdomain = `${sanitizedName}-${shortId}`;

    onLog(`No registered domains found. Auto-generating default subdomain: ${defaultSubdomain}.localhost...\n`);

    const newDomain = await Domain.create({
      projectId: project._id,
      subdomain: defaultSubdomain,
      targetPort: project.deployPort || 8080,
      containerId: deployment.containerId,
      status: "active",
    });
    domains.push(newDomain);
  } else {
    onLog(`Found ${domains.length} registered domain mappings. Rebuilding configurations...\n`);
    // Sync all domains to active container and port
    for (const d of domains) {
      d.containerId = deployment.containerId;
      d.targetPort = project.deployPort || 8080;
      d.status = "active";
      await d.save();
    }
  }

  // 2. Generate configuration text
  const configText = generateNginxConfig(project, domains);

  // 3. Save config file to disk
  saveNginxConfig(project._id.toString(), configText);
  onLog("Nginx config files generated and written to disk successfully.\n");
  io.to(projectRoom).emit("deployment:proxy-config-created", {
    projectId: project._id.toString(),
    deploymentId: deployment._id.toString(),
  });

  // 4. Reload Nginx service container
  onLog("Reloading Nginx proxy service container to load configuration...\n");
  await reloadNginx();
  onLog("Nginx hot-reload successful. Route configurations applied.\n");
  io.to(projectRoom).emit("deployment:nginx-reloaded", {
    projectId: project._id.toString(),
    deploymentId: deployment._id.toString(),
  });

  // 5. Emit domain ready notifications
  const accessUrls = domains.map(d => d.domain ? `http://${d.domain}` : `http://${d.subdomain}.localhost`);
  onLog(`Deployments are now publicly reachable at:\n${accessUrls.map(url => `  - ${url}`).join("\n")}\n`);

  io.to(projectRoom).emit("deployment:domain-ready", {
    projectId: project._id.toString(),
    deploymentId: deployment._id.toString(),
    domains: domains.map(d => ({
      _id: d._id,
      url: d.domain ? `http://${d.domain}` : `http://${d.subdomain}.localhost`,
      status: d.status,
    })),
  });
};

module.exports = {
  generateNginxConfig,
  saveNginxConfig,
  reloadNginx,
  setupReverseProxy,
};
