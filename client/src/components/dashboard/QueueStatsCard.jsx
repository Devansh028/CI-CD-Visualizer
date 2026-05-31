import React from "react";
import { ListTodo, Play, Check, AlertTriangle, Clock } from "lucide-react";

/**
 * Renders detailed job counts of the BullMQ deployment processor.
 */
const QueueStatsCard = ({ queues }) => {
  if (!queues) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl h-full flex items-center justify-center animate-pulse">
        <span className="text-xs text-gray-500">Retrieving queue metrics...</span>
      </div>
    );
  }

  const { active, waiting, completed, failed, delayed } = queues;
  const total = active + waiting + completed + failed + delayed;

  const stats = [
    {
      label: "Active Jobs",
      count: active,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      icon: <Play className="h-3.5 w-3.5" />,
      barColor: "bg-blue-500",
    },
    {
      label: "Waiting (Queued)",
      count: waiting,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      icon: <ListTodo className="h-3.5 w-3.5" />,
      barColor: "bg-purple-500",
    },
    {
      label: "Completed",
      count: completed,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: <Check className="h-3.5 w-3.5" />,
      barColor: "bg-emerald-500",
    },
    {
      label: "Failed",
      count: failed,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      barColor: "bg-rose-500",
    },
    {
      label: "Delayed",
      count: delayed,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: <Clock className="h-3.5 w-3.5" />,
      barColor: "bg-amber-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase">
            Queue Processor Stats
          </h3>
          <span className="text-[10px] font-mono text-gray-500">
            Total Jobs: {total}
          </span>
        </div>

        <div className="space-y-4">
          {stats.map((stat, idx) => {
            const pct = total > 0 ? (stat.count / total) * 100 : 0;
            return (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md border ${stat.color.split(" ")[2]} ${stat.color.split(" ")[1]}`}>
                      {stat.icon}
                    </span>
                    <span className="text-xs text-gray-300 font-medium">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {stat.count}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stat.barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QueueStatsCard;
