import { Server, Calendar, Clock, Activity } from "lucide-react";

/**
 * DeploymentStatusCard renders pipeline stages progress, status tags, ports, duration, and health states.
 * 
 * @param {Object} deployment - The Deployment object
 */
const DeploymentStatusCard = ({ deployment }) => {
  if (!deployment) return null;

  const { status, currentStage, containerPort, duration, createdAt } = deployment;

  // Map stage status to progress percentage
  const getStageProgress = (stage) => {
    switch (stage) {
      case "queued":
        return 5;
      case "code-fetch":
        return 15;
      case "dependency-install":
        return 30;
      case "build":
        return 45;
      case "docker-build":
        return 65;
      case "container-start":
        return 80;
      case "reverse-proxy-setup":
        return 90;
      case "health-check":
        return 98;
      case "success":
        return 100;
      case "failed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "running":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const getProgressColor = (status) => {
    if (status === "failed") return "bg-rose-500";
    if (status === "success") return "bg-emerald-500";
    return "bg-gradient-to-r from-purple-500 to-indigo-600";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Deployment pipeline</h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1">Job ID: {deployment._id}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusBadgeClass(status)}`}>
          {status}
        </span>
      </div>

      {/* Progress percentage */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-gray-400">Current Stage: <span className="text-purple-400 font-mono uppercase">{currentStage}</span></span>
          <span className="text-gray-300">{getStageProgress(currentStage)}%</span>
        </div>
        <div className="w-full bg-[#08090d] rounded-full h-2 overflow-hidden border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(status)}`}
            style={{ width: `${getStageProgress(currentStage)}%` }}
          ></div>
        </div>
      </div>

      {/* Grid attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
        {/* Trigger timestamp */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Triggered At</p>
            <p className="text-xs text-gray-300 font-medium mt-0.5">{formatDate(createdAt)}</p>
          </div>
        </div>

        {/* Runtime durations */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-gray-500 shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Duration</p>
            <p className="text-xs text-gray-300 font-mono font-medium mt-0.5">
              {status === "running" ? "Running..." : `${duration || 0} seconds`}
            </p>
          </div>
        </div>

        {/* Dynamic assigned port */}
        {containerPort && (
          <div className="flex items-center gap-3">
            <Server className="h-4 w-4 text-gray-500 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Host Port</p>
              <p className="text-xs text-indigo-400 font-mono font-bold mt-0.5">{containerPort}</p>
            </div>
          </div>
        )}

        {/* Container health status */}
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-gray-500 shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Container Health</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${
                status === "success" ? "bg-emerald-500" : status === "failed" ? "bg-rose-500" : "bg-amber-500 animate-pulse"
              }`}></span>
              <span className="text-xs text-gray-300 font-medium">
                {status === "success" ? "Healthy (HTTP 200)" : status === "failed" ? "Unhealthy" : "Pinging..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentStatusCard;
