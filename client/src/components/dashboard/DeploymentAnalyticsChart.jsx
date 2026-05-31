import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BarChart3, PieChartIcon } from "lucide-react";

/**
 * Renders Recharts visualizations for Deployment Success/Failure counts and chronological Build Durations.
 */
const DeploymentAnalyticsChart = ({ deployments }) => {
  if (!deployments) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl h-[350px] flex items-center justify-center animate-pulse">
        <span className="text-xs text-gray-500">Retrieving charts data...</span>
      </div>
    );
  }

  const { successful, failed, recentActivity } = deployments;

  // 1. Success vs Failure Pie Data
  const pieData = [
    { name: "Success", value: successful || 0, color: "#10b981" }, // Emerald 500
    { name: "Failed", value: failed || 0, color: "#f43f5e" },      // Rose 500
  ];

  // Filters out slices with zero values to prevent visual bugs
  const activePieData = pieData.filter((d) => d.value > 0);

  // 2. Chronological build duration trend for recent deployments
  const trendData = recentActivity
    ? [...recentActivity]
        .reverse()
        .map((d, idx) => ({
          name: d.deploymentVersion || `#${idx + 1}`,
          duration: d.duration || 0,
          projectName: d.projectName || "Project",
        }))
    : [];

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0e1017] border border-white/10 p-3 rounded-lg shadow-xl text-xs font-semibold">
          <p className="text-white mb-1">{data.name}</p>
          <p style={{ color: data.color }}>
            Deployments: <span className="font-mono">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTrendTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0e1017] border border-white/10 p-3 rounded-lg shadow-xl text-xs font-semibold text-gray-300">
          <p className="text-white font-bold mb-1">{data.projectName}</p>
          <p className="text-purple-400">
            Version: <span className="text-white font-mono">{data.name}</span>
          </p>
          <p className="text-indigo-400 mt-0.5">
            Duration: <span className="text-white font-mono">{data.duration}s</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Pie Chart Block */}
      <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4" /> Success / Failure Ratio
          </h3>
          <p className="text-[11px] text-gray-500 font-light leading-relaxed">
            Distribution of successful deployments versus failed builds across active environments.
          </p>
        </div>

        <div className="h-[220px] w-full flex items-center justify-center relative">
          {activePieData.length === 0 ? (
            <div className="text-xs text-gray-600 font-medium">No deployment records available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {activePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-gray-400 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Area Chart Block */}
      <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4" /> Build Duration Trend
          </h3>
          <p className="text-[11px] text-gray-500 font-light leading-relaxed">
            Performance trend showing compile and deployment durations (in seconds) over recent runs.
          </p>
        </div>

        <div className="h-[220px] w-full mt-4">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-600 font-medium">
              No historical data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2b36" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: "Seconds", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 10, offset: 10 }}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="duration"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDuration)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentAnalyticsChart;
