import React from "react";
import { Cpu, HardDrive, Shield, Activity, Calendar } from "lucide-react";

/**
 * Renders local system core details (CPU, Memory, Disk, Status, Uptime).
 */
const SystemHealthPanel = ({ system }) => {
  if (!system) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl h-full flex items-center justify-center animate-pulse">
        <span className="text-xs text-gray-500">Retrieving system stats...</span>
      </div>
    );
  }

  const { cpuUsage, memoryUsage, diskUsage, uptime, serverStatus, details } = system;

  const getStatusBadge = (status) => {
    const configs = {
      healthy: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      unhealthy: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${configs[status] || configs.healthy}`}>
        {status}
      </span>
    );
  };

  const parsePercentage = (str) => parseInt(str.replace("%", ""), 10) || 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase">
            Host Diagnostics
          </h3>
          {getStatusBadge(serverStatus)}
        </div>

        <div className="space-y-5">
          {/* CPU Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-purple-400" /> CPU Usage
              </span>
              <span className="font-mono">{cpuUsage}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                style={{ width: cpuUsage }}
              />
            </div>
          </div>

          {/* Memory Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-400" /> Memory Usage
              </span>
              <span className="font-mono">
                {memoryUsage} {details && <span className="text-[10px] text-gray-500">({details.freeMemoryGB}GB / {details.totalMemoryGB}GB Free)</span>}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500"
                style={{ width: memoryUsage }}
              />
            </div>
          </div>

          {/* Disk Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-emerald-400" /> Disk Capacity
              </span>
              <span className="font-mono">{diskUsage}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: diskUsage }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs font-medium text-gray-400">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">Server Uptime</div>
          <div className="text-white mt-0.5 flex items-center gap-1 font-mono">
            <Calendar className="h-3.5 w-3.5 text-purple-400/80" />
            {uptime}
          </div>
        </div>
        {details && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500">Host Core Specs</div>
            <div className="text-white mt-0.5 flex items-center gap-1 truncate capitalize">
              <Shield className="h-3.5 w-3.5 text-indigo-400/80" />
              {details.platform} ({details.cpuCores} Cores)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthPanel;
