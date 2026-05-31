import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Cpu, Activity } from "lucide-react";

/**
 * Visualizes real-time streaming host CPU and memory usage statistics over the last 15 ticks.
 */
const ResourceUsageChart = ({ cpuHistory, memHistory }) => {
  const formatPercentage = (val) => `${val}%`;

  const CustomResourceTooltip = ({ active, payload, unit }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0e1017] border border-white/10 p-2.5 rounded-lg shadow-xl text-xs font-semibold">
          <p className="text-gray-400 font-medium mb-1">Time: {payload[0].payload.time}</p>
          <p className="text-white">
            Usage: <span className="font-mono text-purple-400">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CPU Streaming Chart */}
      <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-2">
            <Cpu className="h-4 w-4" /> Live CPU Load
          </h3>
          {cpuHistory.length > 0 && (
            <span className="font-mono text-xs text-white bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Current: {cpuHistory[cpuHistory.length - 1].value}%
            </span>
          )}
        </div>

        <div className="h-[180px] w-full mt-2">
          {cpuHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-600 font-medium">
              Awaiting streaming telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpuLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2b36" opacity={0.3} />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={formatPercentage}
                />
                <Tooltip content={<CustomResourceTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorCpuLive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Memory Streaming Chart */}
      <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-2">
            <Activity className="h-4 w-4" /> Live Memory Load
          </h3>
          {memHistory.length > 0 && (
            <span className="font-mono text-xs text-white bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Current: {memHistory[memHistory.length - 1].value}%
            </span>
          )}
        </div>

        <div className="h-[180px] w-full mt-2">
          {memHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-600 font-medium">
              Awaiting streaming telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMemLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2b36" opacity={0.3} />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={formatPercentage}
                />
                <Tooltip content={<CustomResourceTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorMemLive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceUsageChart;
