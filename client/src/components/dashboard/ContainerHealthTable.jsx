import React, { useState } from "react";
import { Server, ShieldAlert, CheckCircle2, RotateCw, Copy, Check, ExternalLink } from "lucide-react";

/**
 * Lists Docker container profiles including CPU, Memory, Port bindings, and Restart status.
 */
const ContainerHealthTable = ({ containers }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getHealthBadge = (health, status) => {
    const config = {
      healthy: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      starting: "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse",
      unhealthy: "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-bounce",
      stopped: "bg-white/5 text-gray-400 border border-white/5",
    };

    const label = health === "healthy" ? status : health;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config[health] || config.stopped}`}>
        {health === "healthy" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
        {label}
      </span>
    );
  };

  const isSystemContainer = (name) => {
    const systemNames = ["cicd-backend", "redis", "mongodb", "nginx"];
    return systemNames.some(sys => name.toLowerCase().includes(sys));
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase">
            Container Instance Daemon
          </h3>
          <p className="text-[11px] text-gray-500 font-light mt-1">
            Real-time status of pipeline runners and project environments.
          </p>
        </div>
        <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded text-gray-400">
          Total Nodes: {containers?.length || 0}
        </span>
      </div>

      {!containers || containers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/5 p-12 text-center flex flex-col items-center justify-center">
          <Server className="h-8 w-8 text-gray-600 mb-3" />
          <h3 className="text-xs font-bold text-gray-300">No docker instances registered</h3>
          <p className="text-[11px] text-gray-500 max-w-xs mt-1">
            Docker node listing is offline or no active runner containers exist on the server host.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4">Container ID</th>
                <th className="py-3 px-4">Instance Name</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">CPU</th>
                <th className="py-3 px-4 text-right">Memory</th>
                <th className="py-3 px-4">Network Ports</th>
                <th className="py-3 px-4 text-center">Restarts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {containers.map((container) => {
                const isSys = isSystemContainer(container.name);
                return (
                  <tr
                    key={container.id}
                    className="hover:bg-white/2 transition duration-200"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(container.id)}
                          className="text-gray-500 hover:text-white transition cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedId === container.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <span>{container.id}</span>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={container.name}>
                          {container.name}
                        </span>
                        {isSys && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest font-mono bg-white/5 border border-white/5 text-purple-400 scale-[0.9]">
                            SYSTEM
                          </span>
                        )}
                      </div>
                    </td>

                    {/* State Badge */}
                    <td className="py-3.5 px-4">
                      {getHealthBadge(container.health, container.status)}
                    </td>

                    {/* CPU */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-200">
                      {container.status === "running" ? container.cpuUsage : "-"}
                    </td>

                    {/* Memory */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-200">
                      {container.status === "running" ? container.memoryUsage : "-"}
                    </td>

                    {/* Exposed Ports */}
                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      {container.port ? (
                        <div className="flex items-center gap-1">
                          <span className="text-indigo-400 font-bold">{container.port}</span>
                          <span className="text-gray-600">{"->"}</span>
                          <span>{container.exposedPorts[0]?.split(":")[1] || container.exposedPorts[0] || "80"}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600">None</span>
                      )}
                    </td>

                    {/* Restarts */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <RotateCw className="h-3 w-3 text-gray-500" />
                        <span className={`font-mono font-bold ${container.restartCount > 0 ? "text-amber-400 font-extrabold" : "text-gray-400"}`}>
                          {container.restartCount}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContainerHealthTable;
