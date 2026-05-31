import React from "react";
import { Layers, CheckCircle2, Server, Clock, HelpCircle } from "lucide-react";

/**
 * Grid of KPI Metrics Cards highlighting total deployments, success rates, container stats, and queue sizes.
 */
const MetricsCards = ({ deployments, containers, queues }) => {
  // Extract values with sensible fallbacks
  const totalDeployments = deployments?.totalDeployments ?? "-";
  const successRate = deployments?.successRate ?? "-";
  
  // Calculate active (running) containers
  const runningContainers = containers ? containers.filter(c => c.status === "running").length : "-";
  const totalContainers = containers ? containers.length : "-";

  // Calculate active jobs in BullMQ (active + waiting + delayed)
  const activeJobs = queues ? (queues.active + queues.waiting) : "-";

  const cardsData = [
    {
      title: "Total Deployments",
      value: totalDeployments,
      description: "Aggregated builds in current projects",
      icon: <Layers className="h-5 w-5 text-purple-400" />,
      glowColor: "from-purple-500/20 to-indigo-500/20",
      borderColor: "group-hover:border-purple-500/30",
    },
    {
      title: "Success Rate",
      value: successRate,
      description: "Percentage of successful runs",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
      glowColor: "from-emerald-500/20 to-teal-500/20",
      borderColor: "group-hover:border-emerald-500/30",
    },
    {
      title: "Active Containers",
      value: `${runningContainers} / ${totalContainers}`,
      description: "Running project microservices",
      icon: <Server className="h-5 w-5 text-indigo-400" />,
      glowColor: "from-indigo-500/20 to-blue-500/20",
      borderColor: "group-hover:border-indigo-500/30",
    },
    {
      title: "Queue Active Jobs",
      value: activeJobs,
      description: "Pending or executing builds",
      icon: <Clock className="h-5 w-5 text-amber-400" />,
      glowColor: "from-amber-500/20 to-yellow-500/20",
      borderColor: "group-hover:border-amber-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cardsData.map((card, idx) => (
        <div
          key={idx}
          className="group relative rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          {/* Subtle backglow */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.glowColor} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 pointer-events-none -z-10`} />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {card.title}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/5 shadow-inner">
              {card.icon}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {card.value}
            </h3>
            <p className="text-[11px] text-gray-500 font-light mt-1">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
