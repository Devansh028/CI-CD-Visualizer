import React from "react";
import { Link } from "react-router-dom";
import { GitBranch, Clock, Terminal, Activity, Calendar, GitCommit } from "lucide-react";

/**
 * Lists the 10 most recent deployments with clickable route references to pipelines and runtime logs.
 */
const RecentDeploymentsWidget = ({ deployments }) => {
  const recentList = deployments?.recentActivity || [];

  const getStatusConfig = (status) => {
    const configs = {
      success: {
        text: "Success",
        badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        indicator: "bg-emerald-500",
      },
      failed: {
        text: "Failed",
        badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        indicator: "bg-rose-500",
      },
      running: {
        text: "Running",
        badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse",
        indicator: "bg-amber-500 animate-ping",
      },
      queued: {
        text: "Queued",
        badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        indicator: "bg-purple-500",
      },
      "rolled-back": {
        text: "Rolled Back",
        badge: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
        indicator: "bg-slate-500",
      },
    };
    return configs[status] || configs.queued;
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase">
            Recent Activity
          </h3>
          <span className="text-[10px] font-mono text-gray-500">
            Last 10 deployments
          </span>
        </div>

        {recentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No recent deployment runs found.
          </div>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {recentList.map((dep) => {
              const statusCfg = getStatusConfig(dep.status);
              return (
                <div
                  key={dep._id}
                  className="group relative rounded-xl border border-white/5 bg-[#08090d]/50 p-4 hover:border-purple-500/20 transition duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      {/* Project and version details */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white group-hover:text-purple-400 transition duration-200">
                          {dep.projectName || "Unknown Project"}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[9px] font-bold text-gray-400">
                          {dep.deploymentVersion}
                        </span>
                      </div>

                      {/* Commit info */}
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-gray-500">
                        <GitCommit className="h-3 w-3 text-gray-600 shrink-0" />
                        <span className="text-gray-400">{dep.commitHash?.substring(0, 7) || "abc1234"}</span>
                        <span>/</span>
                        <GitBranch className="h-3 w-3 text-purple-500/80 shrink-0" />
                        <span className="text-purple-400 font-semibold">{dep.branch}</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusCfg.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.indicator}`} />
                      {statusCfg.text}
                    </span>
                  </div>

                  {/* Commit message summary */}
                  {dep.commitMessage && (
                    <p className="text-[11px] text-gray-400 font-light truncate mb-3 leading-normal">
                      "{dep.commitMessage}"
                    </p>
                  )}

                  {/* Meta items and logs links */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-600" />
                        {dep.duration ? `${dep.duration}s` : "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-600" />
                        {formatTime(dep.createdAt)}
                      </span>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/deployments/${dep._id}/logs`}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 hover:text-white transition duration-200"
                        title="View Deployment Logs"
                      >
                        Logs
                      </Link>
                      <Link
                        to={`/deployments/${dep._id}/pipeline`}
                        className="p-1 rounded bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 transition duration-200 border border-purple-500/10"
                        title="View Visualizer"
                      >
                        <Terminal className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentDeploymentsWidget;
