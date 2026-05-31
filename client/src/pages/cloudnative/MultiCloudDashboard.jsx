import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  Cloud,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Server,
  DollarSign,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  Database,
  ExternalLink
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const MultiCloudDashboard = () => {
  const [connections, setConnections] = useState([]);
  const [targets, setTargets] = useState([]);
  const [activeProviderTab, setActiveProviderTab] = useState("aws");
  const [analytics, setAnalytics] = useState(null);
  
  // Connection Form State
  const [connName, setConnName] = useState("");
  const [connProvider, setConnProvider] = useState("aws");
  const [connRegion, setConnRegion] = useState("us-east-1");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");

  // Target Form State
  const [targetName, setTargetName] = useState("");
  const [targetType, setTargetType] = useState("k8s-cluster");
  const [targetConnectionId, setTargetConnectionId] = useState("");
  const [nodeCount, setNodeCount] = useState("3");
  const [instanceType, setInstanceType] = useState("t3.medium");

  // Loading states
  const [isLoadingConn, setIsLoadingConn] = useState(false);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchConnections = async () => {
    setIsLoadingConn(true);
    try {
      const res = await API.get("/cloud/connections");
      setConnections(res.data || []);
      if (res.data && res.data.length > 0 && !targetConnectionId) {
        setTargetConnectionId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cloud credentials.");
    } finally {
      setIsLoadingConn(false);
    }
  };

  const fetchTargets = async () => {
    setIsLoadingTargets(true);
    try {
      const res = await API.get("/cloud/targets");
      setTargets(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch deployment targets.");
    } finally {
      setIsLoadingTargets(false);
    }
  };

  const fetchAnalytics = async (provider) => {
    setIsLoadingAnalytics(true);
    try {
      const res = await API.get(`/cloud/analytics?provider=${provider}`);
      setAnalytics(res.data || null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cost analytics.");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchTargets();
  }, []);

  useEffect(() => {
    fetchAnalytics(activeProviderTab);
  }, [activeProviderTab]);

  // Create cloud connection
  const handleAddConnection = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await API.post("/cloud/connections", {
        name: connName,
        provider: connProvider,
        region: connRegion,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
      });
      setSuccess("Cloud connection credentials added successfully!");
      setConnName("");
      setAccessKey("");
      setSecretKey("");
      
      // Refresh list
      fetchConnections();
    } catch (err) {
      console.error(err);
      setError("Failed to add cloud connection credentials.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete cloud connection
  const handleDeleteConnection = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete connection "${name}"? This will also remove any mapped deployment targets.`)) return;
    setActionLoading(true);
    setError(null);
    try {
      await API.delete(`/cloud/connections/${id}`);
      setSuccess("Cloud connection deleted.");
      fetchConnections();
      fetchTargets();
    } catch (err) {
      console.error(err);
      setError("Failed to delete connection.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create target
  const handleAddTarget = async (e) => {
    e.preventDefault();
    if (!targetConnectionId) {
      setError("Please select a cloud connection first.");
      return;
    }
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const selectedConn = connections.find(c => c._id === targetConnectionId);
      const metadata = targetType === "k8s-cluster" 
        ? { nodeCount: Number(nodeCount), region: selectedConn?.region || "us-east-1" }
        : { instanceType, region: selectedConn?.region || "us-east-1" };

      await API.post("/cloud/targets", {
        name: targetName,
        type: targetType,
        cloudConnectionId: targetConnectionId,
        metadata
      });
      setSuccess("Deployment target registered successfully.");
      setTargetName("");
      fetchTargets();
    } catch (err) {
      console.error(err);
      setError("Failed to create deployment target.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete target
  const handleDeleteTarget = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete target "${name}"?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      await API.delete(`/cloud/targets/${id}`);
      setSuccess("Deployment target removed.");
      fetchTargets();
    } catch (err) {
      console.error(err);
      setError("Failed to delete target.");
    } finally {
      setActionLoading(false);
    }
  };

  // Map provider styling
  const getProviderStyle = (provider) => {
    switch (provider) {
      case "aws":
        return { text: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", progressColor: "#f59e0b" };
      case "gcp":
        return { text: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", progressColor: "#3b82f6" };
      case "azure":
        return { text: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20", progressColor: "#0ea5e9" };
      case "digitalocean":
        return { text: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", progressColor: "#6366f1" };
      default:
        return { text: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20", progressColor: "#9ca3af" };
    }
  };

  const getTargetIcon = (type) => {
    return type === "k8s-cluster" ? Server : Layers;
  };

  const sidebarInfo = {
    title: "Multi-Cloud Suite",
    description: "Module 41 handles Multi-Cloud provider mapping and targets integration, providing interactive cost monitoring graphs.",
    status: "Active",
    statusColor: "text-amber-400"
  };

  // Build cost breakdown chart data
  const costBreakdownData = analytics?.costAnalytics ? [
    { name: "Compute", amount: analytics.costAnalytics.compute, color: "#a855f7" },
    { name: "Storage", amount: analytics.costAnalytics.storage, color: "#6366f1" },
    { name: "Network", amount: analytics.costAnalytics.network, color: "#0ea5e9" }
  ] : [];

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Multi-Cloud Deployments & Analytics
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Provision infrastructure targets across cloud providers and monitor cost metrics.
            </p>
          </div>
          
          <button
            onClick={() => {
              fetchConnections();
              fetchTargets();
              fetchAnalytics(activeProviderTab);
            }}
            disabled={isLoadingConn || isLoadingTargets || isLoadingAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-xs text-gray-300 hover:text-white transition duration-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Provider Data
          </button>
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

        {/* Cost Analytics & Resource Explorer Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Panel */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  Cloud Cost & Billing Tracker
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Real-time usage estimates & cost growth patterns.</p>
              </div>

              {/* Provider Selection Tabs */}
              <div className="flex gap-1.5 bg-[#07080c] border border-white/5 p-1 rounded-lg">
                {["aws", "gcp", "azure", "digitalocean"].map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setActiveProviderTab(prov)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition duration-200 cursor-pointer ${
                      activeProviderTab === prov
                        ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingAnalytics ? (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Loading analytics details...
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Billing Callout */}
                <div className="md:col-span-1 flex flex-col justify-between bg-[#07080c]/60 border border-white/5 rounded-xl p-5">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider">Monthly Est. Total</span>
                    <div className="text-3xl font-extrabold text-white flex items-baseline gap-1 font-mono">
                      <span className="text-sm font-bold text-amber-500">$</span>
                      {analytics.costAnalytics.monthlyTotal.toFixed(2)}
                    </div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="space-y-3 mt-6">
                    {costBreakdownData.map((data, index) => (
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400">{data.name}</span>
                          <span className="text-white font-bold">${data.amount.toFixed(2)}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(data.amount / analytics.costAnalytics.monthlyTotal) * 100}%`,
                              backgroundColor: data.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Trend Chart */}
                <div className="md:col-span-2 h-64 bg-[#07080c]/30 rounded-xl p-2 border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-gray-500 font-mono tracking-wider pl-2 mb-2 block">7-Day Expenditure Pattern ($)</span>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={analytics.costAnalytics.dailyCosts}>
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" stroke="#475569" fontSize={9} fontClassName="font-mono" />
                      <YAxis stroke="#475569" fontSize={9} fontClassName="font-mono" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1017", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff", fontSize: "10px" }}
                        itemStyle={{ color: "#f59e0b", fontSize: "10px" }}
                      />
                      <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </div>

          {/* Cloud Inventory / Resource Explorer */}
          <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              Resource Explorer
            </h2>

            <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
              {isLoadingAnalytics ? (
                <div className="h-48 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Scanning cloud resources...
                </div>
              ) : !analytics || analytics.resourceInventory.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500">
                  No active resources found in this connection region.
                </div>
              ) : (
                analytics.resourceInventory.map((item, idx) => (
                  <div key={idx} className="p-3 border border-white/5 bg-[#07080c]/60 rounded-xl space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono truncate">{item.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="text-[10px] text-gray-400">{item.type}</div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 pt-1.5 border-t border-white/5">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
                      <span className="text-indigo-400">{item.details}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Credentials / Target Administration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cloud Connections manager */}
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cloud className="h-4 w-4 text-amber-400" />
              Credentials Management
            </h2>

            {/* Form */}
            <form onSubmit={handleAddConnection} className="bg-[#07080c]/60 border border-white/5 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-white">Add Cloud Provider Connection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Connection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="aws-production-acc"
                    value={connName}
                    onChange={(e) => setConnName(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-amber-500/50 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Provider</label>
                  <select
                    value={connProvider}
                    onChange={(e) => setConnProvider(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none transition"
                  >
                    <option value="aws">AWS (Amazon Web Services)</option>
                    <option value="gcp">GCP (Google Cloud Platform)</option>
                    <option value="azure">Azure (Microsoft Azure)</option>
                    <option value="digitalocean">DigitalOcean</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Default Region</label>
                  <input
                    type="text"
                    required
                    placeholder="us-east-1"
                    value={connRegion}
                    onChange={(e) => setConnRegion(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-amber-500/50 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Access Key ID</label>
                  <input
                    type="text"
                    required
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-amber-500/50 focus:outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Secret Key / Secret token</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••••••"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-amber-500/50 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !connName.trim()}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 text-slate-950 px-4 py-2 text-xs font-extrabold shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Connect Cloud Account
              </button>
            </form>

            {/* List */}
            <div className="space-y-2.5 overflow-y-auto max-h-60 pr-1">
              {isLoadingConn ? (
                <div className="h-20 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying credentials...
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 font-light">
                  No active credentials connected. Add AWS/GCP accounts above.
                </div>
              ) : (
                connections.map((c) => {
                  const style = getProviderStyle(c.provider);
                  return (
                    <div
                      key={c._id}
                      className="p-3.5 rounded-xl border border-white/5 bg-[#07080c]/60 flex items-center justify-between text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{c.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${style.bg} ${style.text}`}>
                            {c.provider}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-500">
                          Region: {c.region} | Access Key: {c.credentials?.accessKeyId?.substring(0, 8)}...
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteConnection(c._id, c.name)}
                        disabled={actionLoading}
                        className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Deployment Targets (EKS, GKE, EC2 instances, Droplets) */}
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-400" />
              Deployment Targets
            </h2>

            {/* Target Creation Form */}
            <form onSubmit={handleAddTarget} className="bg-[#07080c]/60 border border-white/5 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-white">Register Target Instance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Target Name</label>
                  <input
                    type="text"
                    required
                    placeholder="eks-us-east"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Associated Connection</label>
                  <select
                    value={targetConnectionId}
                    onChange={(e) => setTargetConnectionId(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                  >
                    <option value="">Select connection...</option>
                    {connections.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Target Type</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                  >
                    <option value="k8s-cluster">Kubernetes Cluster (EKS/AKS/GKE)</option>
                    <option value="virtual-machine">Virtual Machine (EC2/Droplet)</option>
                    <option value="serverless-function">Serverless / Lambda</option>
                  </select>
                </div>

                {targetType === "k8s-cluster" ? (
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Node Count</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={nodeCount}
                      onChange={(e) => setNodeCount(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1.5">Instance Size</label>
                    <input
                      type="text"
                      placeholder="t3.medium"
                      value={instanceType}
                      onChange={(e) => setInstanceType(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading || !targetName.trim() || !targetConnectionId}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white px-4 py-2 text-xs font-bold shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Register Deployment Target
              </button>
            </form>

            {/* List */}
            <div className="space-y-2.5 overflow-y-auto max-h-60 pr-1">
              {isLoadingTargets ? (
                <div className="h-20 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying target registers...
                </div>
              ) : targets.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 font-light">
                  No targets registered yet. Build and select cloud account targets.
                </div>
              ) : (
                targets.map((t) => {
                  const Icon = getTargetIcon(t.type);
                  return (
                    <div
                      key={t._id}
                      className="p-3 rounded-xl border border-white/5 bg-[#07080c]/60 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-indigo-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{t.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Type: {t.type} | Region: {t.metadata?.region || "global"}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTarget(t._id, t.name)}
                        disabled={actionLoading}
                        className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MultiCloudDashboard;
