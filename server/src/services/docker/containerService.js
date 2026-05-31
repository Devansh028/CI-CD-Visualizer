const Docker = require("dockerode");
const net = require("net");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Helper to dynamically scan for an available port on the host.
 */
const getFreePort = () => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
};

/**
 * Deploys a new Docker container from the built Docker image.
 * Safely stops and removes any previously running container for the project.
 * 
 * @param {Object} project - The Project mongoose document
 * @param {Object} dockerImage - The DockerImage mongoose document
 * @param {Function} onData - Log callback
 * @returns {Promise<Object>} - Contains containerId, containerPort, containerStatus
 */
const runContainer = async (project, dockerImage, onData) => {
  const containerName = `cicd-project-${project._id}`;
  const imageName = `${dockerImage.imageName}:${dockerImage.tag}`;
  const deployPort = project.deployPort || 8080;

  // 1. Stop and remove existing container if running
  try {
    const existing = docker.getContainer(containerName);
    const inspect = await existing.inspect();
    onData(`Found existing container '${containerName}'. Stopping...\n`);
    if (inspect.State.Running) {
      await existing.stop();
    }
    onData(`Removing existing container '${containerName}'...\n`);
    await existing.remove();
  } catch (err) {
    // If container doesn't exist, ignore the error
  }

  // 2. Select a dynamic port on the host
  const hostPort = await getFreePort();
  onData(`Selected host port mapping: ${hostPort} (host) -> ${deployPort} (container)\n`);

  // 3. Prepare environment variables (add PORT env so apps listen on the correct port)
  const EnvironmentVariable = require("../../models/EnvironmentVariable");
  const { decrypt } = require("../../utils/crypto");
  
  let envList = [];
  try {
    const dbVars = await EnvironmentVariable.find({ projectId: project._id });
    if (dbVars && dbVars.length > 0) {
      envList = dbVars.map(v => {
        const val = v.isSecret ? decrypt(v.encryptedValue) : v.value;
        return `${v.key}=${val}`;
      });
    } else {
      // Fallback to legacy project.environmentVariables
      envList = (project.environmentVariables || []).map(v => `${v.key}=${v.value}`);
    }
  } catch (dbErr) {
    onData(`Warning: Could not fetch database environment variables: ${dbErr.message}. Falling back to legacy settings.\n`);
    envList = (project.environmentVariables || []).map(v => `${v.key}=${v.value}`);
  }

  const envVars = [
    `PORT=${deployPort}`,
    ...envList,
  ];

  // 4. Auto-detect which Docker network the backend container is running on (for sibling networking)
  let networkName = "bridge";
  try {
    const backend = docker.getContainer("cicd-backend");
    const info = await backend.inspect();
    const networks = Object.keys(info.NetworkSettings.Networks);
    if (networks.length > 0) {
      networkName = networks[0];
    }
  } catch (err) {
    onData(`Could not inspect 'cicd-backend' container. Defaulting network to 'bridge'.\n`);
  }

  onData(`Creating container '${containerName}' on network '${networkName}'...\n`);

  // 5. Create the container configuration
  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    ExposedPorts: {
      [`${deployPort}/tcp`]: {},
    },
    HostConfig: {
      PortBindings: {
        [`${deployPort}/tcp`]: [{ HostPort: `${hostPort}` }],
      },
      RestartPolicy: {
        Name: "always",
      },
    },
    Env: envVars,
  });

  // 6. Connect to the auto-detected network if not 'bridge' (bridge is joined automatically)
  if (networkName !== "bridge") {
    try {
      const net = docker.getNetwork(networkName);
      await net.connect({ Container: container.id });
    } catch (netErr) {
      onData(`Warning: Failed to attach container to network '${networkName}': ${netErr.message}. Attempting to start anyway...\n`);
    }
  }

  // 7. Start container
  onData(`Starting container '${containerName}'...\n`);
  await container.start();

  onData(`Container successfully launched (ID: ${container.id.substring(0, 12)}).\n`);

  return {
    containerId: container.id,
    containerPort: hostPort,
    containerStatus: "running",
  };
};

module.exports = {
  runContainer,
};
