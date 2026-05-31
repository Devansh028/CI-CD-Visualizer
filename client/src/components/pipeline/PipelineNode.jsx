import { Handle, Position } from "reactflow";
import { GitBranch, Box, Wrench, Layers, Server, Globe, Activity, CheckCircle2, XCircle, ArrowRightCircle, Circle } from "lucide-react";

const STAGE_ICONS = {
  "code-fetch": GitBranch,
  "dependency-install": Box,
  "build": Wrench,
  "docker-build": Layers,
  "container-start": Server,
  "reverse-proxy-setup": Globe,
  "health-check": Activity,

  // Backend native stage keys
  "cloning": GitBranch,
  "building": Wrench,
  "dockerizing": Layers,
  "deploying": Server,
  "running": Globe,
};

const STAGE_LABELS = {
  "code-fetch": "Fetch Code",
  "dependency-install": "Install Deps",
  "build": "Build App",
  "docker-build": "Docker Build",
  "container-start": "Start Container",
  "reverse-proxy-setup": "Nginx Config",
  "health-check": "Health Check",

  // Backend native stage keys
  "cloning": "Clone Repository",
  "building": "Build Project",
  "dockerizing": "Docker Build",
  "deploying": "Deploy",
  "running": "Running",
};

const PipelineNode = ({ data }) => {
  const { name, status, duration, startedAt, index, totalStages } = data;
  
  const IconComponent = STAGE_ICONS[name] || Box;
  const label = STAGE_LABELS[name] || name;

  const getStatusStyles = (status) => {
    switch (status) {
      case "running":
        return {
          container: "border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-gradient-to-br from-purple-950/20 via-[#0e1017] to-indigo-950/10",
          badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse",
          iconColor: "text-purple-400",
          indicator: <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></span>
        };
      case "success":
        return {
          container: "border-emerald-500/30 hover:border-emerald-500/50 bg-[#0e1017]/80",
          badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          iconColor: "text-emerald-400",
          indicator: <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 animate-bounce" />
        };
      case "failed":
        return {
          container: "border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)] bg-[#0e1017]/80",
          badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
          iconColor: "text-rose-400",
          indicator: <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
        };
      case "skipped":
        return {
          container: "border-white/5 border-dashed bg-[#0e1017]/30 opacity-50",
          badge: "bg-white/5 text-gray-500 border border-white/5",
          iconColor: "text-gray-500",
          indicator: <ArrowRightCircle className="h-3 w-3 text-gray-500 shrink-0" />
        };
      default: // pending
        return {
          container: "border-white/5 bg-[#0e1017]/60",
          badge: "bg-white/5 text-gray-400 border border-white/5",
          iconColor: "text-gray-400",
          indicator: <Circle className="h-3 w-3 text-gray-400 shrink-0" />
        };
    }
  };

  const styles = getStatusStyles(status);

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className={`relative w-[210px] rounded-xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 ${styles.container}`}>
      {/* React Flow Handles */}
      {index > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-white/10 !border-white/10 !w-2 !h-2 !left-[-4px]"
        />
      )}
      
      {index < ((totalStages || 5) - 1) && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-white/10 !border-white/10 !w-2 !h-2 !right-[-4px]"
        />
      )}

      {/* Node Content */}
      <div className="space-y-3.5">
        {/* Header: Icon + Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5 ${styles.iconColor}`}>
              <IconComponent className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold text-gray-200 uppercase tracking-tight">{label}</span>
          </div>
          {styles.indicator}
        </div>

        {/* Info panel */}
        <div className="flex items-center justify-between pt-1 font-mono text-[9px] text-gray-500">
          <div>
            {startedAt ? (
              <span className="block text-[8px] text-gray-400">Start: {formatTimestamp(startedAt)}</span>
            ) : (
              <span className="block italic text-[8px] text-gray-600">Not started</span>
            )}
          </div>
          
          {duration !== null && (
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300 font-bold shrink-0">
              {duration}s
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex justify-end pt-0.5">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${styles.badge}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PipelineNode;
