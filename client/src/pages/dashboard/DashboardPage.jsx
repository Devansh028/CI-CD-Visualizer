import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboardStore } from "../../store/dashboardStore";
import { useAuthStore } from "../../store/authStore";
import socketService from "../../services/socket";
import {
  Terminal,
  LogOut,
  Layers,
  Globe,
  Activity,
  Server,
  RefreshCw,
  HardDrive
} from "lucide-react";
import NotificationBell from "../../components/notifications/NotificationBell";
import AppLayout from "../../components/layout/AppLayout";

// Components
import MetricsCards from "../../components/dashboard/MetricsCards";
import SystemHealthPanel from "../../components/dashboard/SystemHealthPanel";
import QueueStatsCard from "../../components/dashboard/QueueStatsCard";
import DeploymentAnalyticsChart from "../../components/dashboard/DeploymentAnalyticsChart";
import ContainerHealthTable from "../../components/dashboard/ContainerHealthTable";
import ResourceUsageChart from "../../components/dashboard/ResourceUsageChart";
import RecentDeploymentsWidget from "../../components/dashboard/RecentDeploymentsWidget";

const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const {
    system,
    containers,
    queues,
    deployments,
    cpuHistory,
    memHistory,
    isLoading,
    error,
    fetchOverview,
    updateSystem,
    updateContainers,
    updateQueues,
    updateDeployments,
  } = useDashboardStore();

  useEffect(() => {
    // 1. Initial REST overview load
    fetchOverview();

    // 2. Join Socket.IO metrics room
    socketService.joinMetrics();

    // 3. Register real-time Socket event listeners
    const handleSystemUpdate = (data) => updateSystem(data);
    const handleQueueUpdate = (data) => updateQueues(data);
    const handleContainerUpdate = (data) => updateContainers(data);
    const handleDeploymentUpdate = (data) => updateDeployments(data);

    socketService.on("metrics:system-update", handleSystemUpdate);
    socketService.on("metrics:queue-update", handleQueueUpdate);
    socketService.on("metrics:container-update", handleContainerUpdate);
    socketService.on("metrics:deployment-update", handleDeploymentUpdate);

    // Cleanup listeners and leave room on component unmount
    return () => {
      socketService.off("metrics:system-update", handleSystemUpdate);
      socketService.off("metrics:queue-update", handleQueueUpdate);
      socketService.off("metrics:container-update", handleContainerUpdate);
      socketService.off("metrics:deployment-update", handleDeploymentUpdate);
      socketService.leaveMetrics();
    };
  }, [
    fetchOverview,
    updateSystem,
    updateContainers,
    updateQueues,
    updateDeployments,
  ]);

  // Loading skeleton block for initial load
  if (isLoading && !system) {
    const sidebarInfo = {
      title: "Analytics Status",
      description: "Metrics are gathered in real-time. Docker stats and BullMQ items are updated automatically via Socket.IO events.",
      status: "Active",
      statusDot: true,
      statusDotColor: "bg-green-500",
      statusColor: "text-green-500",
      statusLabel: "Websockets",
    };

    return (
      <AppLayout sidebarInfo={sidebarInfo}>
        <section className="w-full space-y-8 animate-pulse">
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[#0e1017]/40 border border-white/5 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 h-80 bg-[#0e1017]/40 border border-white/5 rounded-2xl" />
            <div className="col-span-2 h-80 bg-[#0e1017]/40 border border-white/5 rounded-2xl" />
          </div>
        </section>
      </AppLayout>
    );
  }

  const sidebarInfo = {
    title: "Analytics Status",
    description: "Metrics are gathered in real-time. Docker stats and BullMQ items are updated automatically via Socket.IO events.",
    status: "Active",
    statusDot: true,
    statusDotColor: "bg-green-500",
    statusColor: "text-green-500",
    statusLabel: "Websockets",
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      {/* Main Content Area */}
      <section className="w-full flex flex-col gap-8">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                DevOps Monitoring
              </h1>
              <p className="text-xs text-gray-400 font-light mt-1">
                Real-time server clusters health and build statistics.
              </p>
            </div>
            
            <button
              onClick={fetchOverview}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-xs text-gray-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh API
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* 1. Metric Cards Grid */}
          <MetricsCards
            deployments={deployments}
            containers={containers}
            queues={queues}
          />

          {/* 2. Live Resource Streaming Graph */}
          <ResourceUsageChart
            cpuHistory={cpuHistory}
            memHistory={memHistory}
          />

          {/* 3. Deployment Success Pie & Durations */}
          <DeploymentAnalyticsChart deployments={deployments} />

          {/* 4. Infrastructure Health Panel & Recent Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <SystemHealthPanel system={system} />
              <QueueStatsCard queues={queues} />
            </div>
            <div className="lg:col-span-2">
              <RecentDeploymentsWidget deployments={deployments} />
            </div>
          </div>

          {/* 5. Docker Containers Status table */}
          <ContainerHealthTable containers={containers} />
        </section>
    </AppLayout>
  );
};

export default DashboardPage;
