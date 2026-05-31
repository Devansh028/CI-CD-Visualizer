import { GitBranch, User, Tag, Clock, Globe, Server, Activity } from "lucide-react";

const PipelineStatusPanel = ({ deployment }) => {
  if (!deployment) return null;

  const {
    _id,
    projectName,
    branch,
    commitHash,
    commitMessage,
    triggerType,
    pusher,
    currentStage,
    status,
    duration,
    containerPort,
    containerStatus,
    domainUrl,
    failureReason,
  } = deployment;

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "running":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const getHealthDot = (status, cStatus) => {
    if (status === "success" || cStatus === "healthy") {
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Healthy (200 OK)
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          Offline / Unhealthy
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-amber-400 font-semibold animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Waiting...
      </span>
    );
  };

  return (
    <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-2xl backdrop-blur-xl space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Deployment Overview</h3>
        <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {_id}</p>
      </div>

      {/* Main Status Badge */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-gray-400">Status</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(status)}`}>
          {status}
        </span>
      </div>

      {/* Failure Reason */}
      {status === "failed" && failureReason && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">Failure Reason</span>
          <p className="text-xs font-mono text-rose-200 leading-relaxed break-words whitespace-pre-wrap">{failureReason}</p>
        </div>
      )}

      {/* Attributes List */}
      <div className="space-y-4 pt-4 border-t border-white/5 text-xs">
        {/* Project & Branch */}
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Repository Context</span>
          <div className="flex items-center gap-2 text-gray-200">
            <GitBranch className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-semibold truncate max-w-[200px]">{projectName}</span>
            <span className="text-gray-600 font-mono">/</span>
            <span className="text-purple-400 font-mono font-semibold">{branch}</span>
          </div>
        </div>

        {/* Commit Details */}
        {commitMessage && (
          <div className="space-y-1 bg-white/2 rounded-lg p-2.5 border border-white/5">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">Commit Message</span>
            <p className="text-gray-300 font-light italic leading-relaxed text-[11px]">"{commitMessage}"</p>
            <p className="text-[10px] text-purple-400 font-mono mt-1">Hash: {commitHash?.substring(0, 8)}</p>
          </div>
        )}

        {/* Pusher / User */}
        <div className="flex items-center justify-between pt-2 border-b border-white/5 pb-2">
          <span className="text-gray-400 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gray-500" />
            Pusher
          </span>
          <span className="text-gray-200 capitalize font-medium">{pusher || "System"}</span>
        </div>

        {/* Trigger Type */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-gray-500" />
            Trigger Source
          </span>
          <span className="text-gray-200 uppercase font-mono font-bold text-[10px]">{triggerType}</span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            Duration
          </span>
          <span className="text-gray-200 font-mono font-medium">
            {status === "running" ? "Running..." : `${duration || 0}s`}
          </span>
        </div>

        {/* Active stage */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-gray-400">Current Stage</span>
          <span className="text-purple-400 uppercase font-mono font-bold text-[10px]">{currentStage}</span>
        </div>

        {/* Assign Port */}
        {containerPort && (
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-gray-500" />
              Container Port
            </span>
            <span className="text-indigo-400 font-mono font-bold">{containerPort}</span>
          </div>
        )}

        {/* Domain Url */}
        {domainUrl && (
          <div className="space-y-1">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-gray-500" />
              Public URL
            </span>
            <a
              href={`http://${domainUrl}`}
              target="_blank"
              rel="noreferrer"
              className="block text-indigo-400 font-bold hover:underline font-mono truncate text-[11px]"
            >
              http://{domainUrl}
            </a>
          </div>
        )}

        {/* Health */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-gray-500" />
            App Health
          </span>
          {getHealthDot(status, containerStatus)}
        </div>
      </div>
    </div>
  );
};

export default PipelineStatusPanel;
