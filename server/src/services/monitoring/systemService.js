const os = require("os");
const { exec } = require("child_process");
const logger = require("../../utils/logger");

/**
 * Calculates average CPU load averages by measuring ticks over a short interval.
 * 
 * @returns {Promise<number>} CPU usage percentage (0-100)
 */
const getCpuUsage = () => {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      
      if (totalDifference === 0) {
        return resolve(0);
      }
      
      const percentageCpu = 100 - Math.round((100 * idleDifference) / totalDifference);
      resolve(Math.min(100, Math.max(0, percentageCpu)));
    }, 100);
  });
};

/**
 * Helper to compute total and idle ticks across all CPU cores.
 */
function cpuAverage() {
  let totalIdle = 0;
  let totalTick = 0;
  const cpus = os.cpus();

  if (!cpus || cpus.length === 0) {
    return { idle: 0, total: 0 };
  }

  for (let i = 0, len = cpus.length; i < len; i++) {
    const cpu = cpus[i];
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  return { 
    idle: totalIdle / cpus.length, 
    total: totalTick / cpus.length 
  };
}

/**
 * Calculates current disk space usage percentage.
 * Uses powershell on Windows and df on Unix-like operating systems.
 * 
 * @returns {Promise<number>} Disk usage percentage (0-100)
 */
const getDiskUsage = () => {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      // Windows: Query logical disk size and free space for drive C:
      const cmd = 'powershell -Command "Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DeviceID -eq \'C:\'} | Select-Object Size, FreeSpace"';
      exec(cmd, (err, stdout) => {
        if (err || !stdout) {
          logger.warn(`Failed to execute Windows disk query: ${err?.message || "No output"}`);
          return resolve(50); // Safe fallback
        }
        try {
          const lines = stdout.trim().split(/\r?\n/);
          // Look for line containing digits
          const dataLine = lines.find(line => /\d+/.test(line));
          if (dataLine) {
            const matches = dataLine.trim().split(/\s+/);
            if (matches.length >= 2) {
              const size = parseInt(matches[0], 10);
              const free = parseInt(matches[1], 10);
              if (size > 0) {
                const used = size - free;
                return resolve(Math.round((used / size) * 100));
              }
            }
          }
        } catch (e) {
          logger.warn(`Failed to parse Windows disk output: ${e.message}`);
        }
        resolve(50);
      });
    } else {
      // Linux/macOS: Query disk usage of root directory
      exec("df -h /", (err, stdout) => {
        if (err || !stdout) {
          logger.warn(`Failed to execute Unix disk query: ${err?.message || "No output"}`);
          return resolve(50);
        }
        try {
          const lines = stdout.trim().split("\n");
          if (lines.length >= 2) {
            const parts = lines[1].replace(/\s+/g, " ").split(" ");
            const useCol = parts.find(p => p.endsWith("%"));
            if (useCol) {
              return resolve(parseInt(useCol.replace("%", ""), 10));
            }
          }
        } catch (e) {
          logger.warn(`Failed to parse Unix disk output: ${e.message}`);
        }
        resolve(50);
      });
    }
  });
};

/**
 * Format uptime seconds into human-readable string.
 * E.g., "12h 45m" or "45m 12s"
 */
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0 || s > 0) parts.push(`${s}s`);

  return parts.slice(0, 2).join(" "); // return top 2 parts for brevity, e.g. "12h 45m"
};

/**
 * Retrieves overall system health statistics.
 */
const getSystemStats = async () => {
  try {
    const cpuUsagePercent = await getCpuUsage();
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
    
    const diskUsagePercent = await getDiskUsage();
    
    // Server node process uptime
    const uptimeStr = formatUptime(process.uptime());
    
    // Check general load, memory threshold for health assessment
    let serverStatus = "healthy";
    if (cpuUsagePercent > 90 || memoryUsagePercent > 92) {
      serverStatus = "warning";
    }

    return {
      cpuUsage: `${cpuUsagePercent}%`,
      memoryUsage: `${memoryUsagePercent}%`,
      diskUsage: `${diskUsagePercent}%`,
      uptime: uptimeStr,
      serverStatus,
      // Extra details for premium stats UI
      details: {
        totalMemoryGB: (totalMem / (1024 * 1024 * 1024)).toFixed(1),
        freeMemoryGB: (freeMem / (1024 * 1024 * 1024)).toFixed(1),
        processMemoryRSS: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1) + "MB",
        platform: process.platform,
        cpuCores: os.cpus().length,
      }
    };
  } catch (error) {
    logger.error(`Error collecting system stats: ${error.message}`);
    return {
      cpuUsage: "0%",
      memoryUsage: "0%",
      diskUsage: "0%",
      uptime: "0s",
      serverStatus: "unhealthy",
      error: error.message
    };
  }
};

module.exports = {
  getSystemStats,
};
