const Docker = require("dockerode");
const logger = require("../../utils/logger");

const isWindows = process.platform === "win32";
const docker = isWindows 
  ? new Docker({ socketPath: "//./pipe/docker_engine" }) 
  : new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Gets stats for a single container.
 * 
 * @param {Object} container - Dockerode container instance
 * @returns {Promise<Object>} Object with cpuUsage and memoryUsage
 */
const getContainerStats = async (container) => {
  try {
    // stream: false fetches a single snapshot
    const stats = await container.stats({ stream: false });
    
    // CPU Calculations
    const cpuDelta = (stats.cpu_stats?.cpu_usage?.total_usage || 0) - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = (stats.cpu_stats?.system_cpu_usage || 0) - (stats.precpu_stats?.system_cpu_usage || 0);
    const onlineCpus = stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
    
    let cpuUsagePercent = 0;
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuUsagePercent = Math.round((cpuDelta / systemDelta) * onlineCpus * 100);
    }
    
    // Memory Calculations
    const memUsage = stats.memory_stats?.usage || 0;
    const memMB = Math.round(memUsage / (1024 * 1024));
    
    return {
      cpuUsage: `${Math.min(100, Math.max(0, cpuUsagePercent))}%`,
      memoryUsage: `${memMB}MB`
    };
  } catch (err) {
    // Stats fail for stopped containers or temporary connection issues
    return {
      cpuUsage: "0%",
      memoryUsage: "0MB"
    };
  }
};

/**
 * Collects list of containers and aggregates status.
 */
const getContainerStatsList = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    const results = await Promise.all(
      containers.map(async (containerInfo) => {
        const name = containerInfo.Names[0] ? containerInfo.Names[0].replace(/^\//, "") : "unknown";
        const container = docker.getContainer(containerInfo.Id);
        
        let restartCount = 0;
        let healthStatus = "healthy"; // Default to healthy if running, or if no healthcheck
        
        // Inspect container to get restart count and exact state
        try {
          const inspectData = await container.inspect();
          restartCount = inspectData.RestartCount || 0;
          
          if (containerInfo.State === "running") {
            const dockerHealth = inspectData.State?.Health?.Status;
            if (dockerHealth === "unhealthy") {
              healthStatus = "unhealthy";
            } else if (dockerHealth === "starting") {
              healthStatus = "starting";
            }
          } else {
            healthStatus = "stopped";
          }
        } catch (inspectErr) {
          // If inspect fails, fallback to container state
          if (containerInfo.State !== "running") {
            healthStatus = "stopped";
          }
        }

        // Fetch resource stats only for running containers
        let cpuUsage = "0%";
        let memoryUsage = "0MB";
        
        if (containerInfo.State === "running") {
          const stats = await getContainerStats(container);
          cpuUsage = stats.cpuUsage;
          memoryUsage = stats.memoryUsage;
        }

        // Find primary port mapping (prefer host public port if mapped, fallback to private)
        const portObj = containerInfo.Ports.find(p => p.PublicPort);
        const port = portObj ? portObj.PublicPort : (containerInfo.Ports[0]?.PrivatePort || null);
        
        const exposedPorts = containerInfo.Ports.map(p => {
          if (p.PublicPort) {
            return `${p.PublicPort}:${p.PrivatePort}/${p.Type}`;
          }
          return `${p.PrivatePort}/${p.Type}`;
        });

        return {
          id: containerInfo.Id.substring(0, 12),
          name,
          status: containerInfo.State, // running, exited, paused, etc.
          health: healthStatus,        // healthy, unhealthy, starting, stopped
          cpuUsage,
          memoryUsage,
          port,
          exposedPorts,
          restartCount,
          statusText: containerInfo.Status
        };
      })
    );

    return results;
  } catch (error) {
    logger.error(`Error querying Docker stats: ${error.message}`);
    // If docker daemon is unreachable, return empty list
    return [];
  }
};

module.exports = {
  getContainerStatsList,
};
