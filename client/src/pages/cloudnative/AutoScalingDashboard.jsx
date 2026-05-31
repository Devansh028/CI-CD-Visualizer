import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  TrendingUp,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  FileCode,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Database,
  History,
  Copy
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const AutoScalingDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [policy, setPolicy] = useState(null);
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [hpaYaml, setHpaYaml] = useState("");
  const [copied, setCopied] = useState(false);

  // Policy Form State
  const [metricType, setMetricType] = useState("cpu");
  const [minReplicas, setMinReplicas] = useState(2);
  const [maxReplicas, setMaxReplicas] = useState(8);
  const [targetThreshold, setTargetThreshold] = useState(70);
  const [cooldownPeriod, setCooldownPeriod] = useState(300);

  // Loading States
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await API.get("/projects");
      setProjects(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedProjectId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchScalingData = async (projectId) => {
    if (!projectId) return;
    setIsLoadingData(true);
    try {
      // 1. Fetch policy
      const policyRes = await API.get(`/scaling/project/${projectId}/policy`);
      const pol = policyRes.data;
      if (pol && pol._id) {
        setPolicy(pol);
        setMetricType(pol.metricType);
        setMinReplicas(pol.minReplicas);
        setMaxReplicas(pol.maxReplicas);
        setTargetThreshold(pol.targetThreshold);
        setCooldownPeriod(pol.cooldownPeriod);
      } else {
        setPolicy(null);
      }

      // 2. Fetch events
      const eventsRes = await API.get(`/scaling/project/${projectId}/events`);
      setEvents(eventsRes.data || []);

      // 3. Fetch metrics telemetry
      const metricsRes = await API.get(`/scaling/project/${projectId}/metrics`);
      setMetrics(metricsRes.data || []);

      // 4. Fetch HPA YAML
      if (pol && pol._id) {
        const hpaRes = await API.get(`/scaling/project/${projectId}/hpa`);
        setHpaYaml(hpaRes.data?.hpa || "");
      } else {
        setHpaYaml("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchScalingData(selectedProjectId);
    } else {
      setPolicy(null);
      setEvents([]);
      setMetrics([]);
      setHpaYaml("");
    }
  }, [selectedProjectId]);

  const handleCopyManifest = () => {
    if (!hpaYaml) return;
    navigator.clipboard.writeText(hpaYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create or Update policy
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await API.post("/scaling/policies", {
        projectId: selectedProjectId,
        metricType,
        minReplicas: Number(minReplicas),
        maxReplicas: Number(maxReplicas),
        targetThreshold: Number(targetThreshold),
        cooldownPeriod: Number(cooldownPeriod)
      });
      setSuccess("Autoscaling policy configuration saved successfully!");
      fetchScalingData(selectedProjectId);
    } catch (err) {
      console.error(err);
      setError("Failed to configure autoscaling policy.");
    } finally {
      setActionLoading(false);
    }
  };

  const sidebarInfo = {
    title: "Auto-Scaling Suite",
    description: "Module 44 implements dynamic scaling mechanisms, managing deployment configurations and CPU/RAM load simulation.",
    status: "Active Engine",
    statusColor: "text-emerald-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Auto-Scaling Policy Configurator
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Configure horizontal pod auto-scaling and resource telemetry limits for dynamic replica scheduling.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono">Active Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#07080d] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Notices */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400 flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Resource Telemetry Chart */}
        {selectedProjectId && (
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider">Live Metrics Telemetry Stream</h2>
                <p className="text-[10px] text-gray-500">Real-time resource tracking and autoscaling trigger boundaries.</p>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500"></span> CPU Usage</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-500"></span> RAM Usage</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-5 bg-rose-500"></span> Threshold ({targetThreshold}%)</span>
              </div>
            </div>

            {isLoadingData && metrics.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Querying cluster metrics...
              </div>
            ) : metrics.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-gray-500 italic">
                No telemetry logs generated. Save scaling policy parameters to launch telemetry.
              </div>
            ) : (
              <div className="h-60 bg-[#07080c]/30 rounded-xl p-2 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="label" stroke="#475569" fontSize={9} fontClassName="font-mono" />
                    <YAxis stroke="#475569" fontSize={9} fontClassName="font-mono" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1017", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                      labelStyle={{ color: "#fff", fontSize: "10px" }}
                    />
                    <Line type="monotone" dataKey="cpu" name="CPU Usage %" stroke="#10b981" strokeWidth={2} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="memory" name="Memory Usage %" stroke="#3b82f6" strokeWidth={2} />
                    <ReferenceLine y={targetThreshold} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `Threshold (${targetThreshold}%)`, fill: '#f43f5e', fontSize: 9, position: 'top' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Administration Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policy config Form Column */}
          <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              Configure Policy
            </h2>

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Metric Target Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-white/5 bg-[#08090d]">
                  <button
                    type="button"
                    onClick={() => setMetricType("cpu")}
                    className={`py-1.5 rounded text-[10px] font-bold transition duration-200 cursor-pointer ${
                      metricType === "cpu" ? "bg-emerald-500 text-slate-950" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    CPU Core Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricType("memory")}
                    className={`py-1.5 rounded text-[10px] font-bold transition duration-200 cursor-pointer ${
                      metricType === "memory" ? "bg-emerald-500 text-slate-950" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Memory (RAM)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Min Replicas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={minReplicas}
                    onChange={(e) => setMinReplicas(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Max Replicas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={maxReplicas}
                    onChange={(e) => setMaxReplicas(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Target Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="95"
                    required
                    value={targetThreshold}
                    onChange={(e) => setTargetThreshold(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Cooldown (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    required
                    value={cooldownPeriod}
                    onChange={(e) => setCooldownPeriod(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !selectedProjectId}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-slate-950 px-4 py-2.5 text-xs font-bold shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Save Autoscaling Policy
              </button>
            </form>
          </div>

          {/* HPA manifest & Event History Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Event History logs */}
            <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-400" />
                Scaling Events History
              </h2>

              {isLoadingData && events.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying event logs...
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 font-light border border-dashed border-white/5 rounded-xl">
                  No auto-scaling events recorded yet. Load spikes trigger dynamic replicas.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {events.map((ev) => {
                    const isScaleUp = ev.action === "scale-up";
                    return (
                      <div
                        key={ev._id}
                        className="p-3 border border-white/5 bg-[#07080c]/60 rounded-xl flex items-start gap-3 text-left"
                      >
                        <div className={`p-1.5 rounded-lg border ${
                          isScaleUp
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                          {isScaleUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono uppercase">
                              {ev.action}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ({ev.fromReplicas} $\to$ {ev.toReplicas} Replicas)
                            </span>
                            <span className="text-[9px] font-mono text-gray-600">
                              • {new Date(ev.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                            {ev.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generated Kubernetes HPA yaml manifest */}
            {hpaYaml && (
              <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-5 backdrop-blur-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-emerald-400" />
                    Kubernetes HPA Manifest
                  </h3>
                  <button
                    onClick={handleCopyManifest}
                    className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Copied!" : "Copy Yaml"}
                  </button>
                </div>

                <pre className="bg-[#050609] border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-emerald-500 overflow-auto max-h-56 text-left whitespace-pre leading-relaxed select-text scrollbar-thin">
                  <code>{hpaYaml}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AutoScalingDashboard;
