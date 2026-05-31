import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  Key,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Webhook,
  BookOpen,
  Activity,
  Copy,
  Terminal,
  Shield,
  Layers,
  Globe,
  Info
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const DeveloperPortal = () => {
  const [activeTab, setActiveTab] = useState("keys");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  
  // API Keys States
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  
  // Webhooks States
  const [webhooks, setWebhooks] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState(["deployment.success"]);

  // Analytics States
  const [usageLog, setUsageLog] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Copy helper states
  const [copiedId, setCopiedId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Loading/Error states
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load basic dependencies
  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedProjectId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch API Keys
  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await API.get("/dev/keys");
      setApiKeys(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load Developer API Keys.");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Fetch Webhooks
  const fetchWebhooks = async (projectId) => {
    if (!projectId) return;
    setIsLoadingWebhooks(true);
    try {
      const res = await API.get(`/dev/webhooks/${projectId}`);
      setWebhooks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await API.get("/dev/analytics");
      setUsageLog(res.data?.usageLog || []);
      setChartData(res.data?.chartData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchApiKeys();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchWebhooks(selectedProjectId);
    } else {
      setWebhooks([]);
    }
  }, [selectedProjectId]);

  const handleCopyText = (id, text, isKey = false) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Create API Key
  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedKey(null);
    try {
      const res = await API.post("/dev/keys", { name: newKeyName.trim() });
      if (res.data && res.data.apiKey) {
        setGeneratedKey(res.data.apiKey);
        setSuccess(`API Token "${newKeyName}" generated successfully.`);
      }
      setNewKeyName("");
      fetchApiKeys();
    } catch (err) {
      console.error(err);
      setError("Failed to generate API Token.");
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke API Key
  const handleRevokeKey = async (keyId) => {
    if (!window.confirm("Are you sure you want to revoke this API key? Access from applications using this token will be immediately blocked.")) return;
    setActionLoading(true);
    setError(null);
    try {
      await API.delete(`/dev/keys/${keyId}`);
      setSuccess("API token access revoked.");
      fetchApiKeys();
    } catch (err) {
      console.error(err);
      setError("Failed to revoke API key.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Webhook Subscription
  const handleSubscribeWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim() || !selectedProjectId) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await API.post("/dev/webhooks", {
        projectId: selectedProjectId,
        url: webhookUrl.trim(),
        events: webhookEvents
      });
      setSuccess("Webhook listener registered successfully!");
      setWebhookUrl("");
      fetchWebhooks(selectedProjectId);
    } catch (err) {
      console.error(err);
      setError("Failed to subscribe webhook.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Webhook Subscription
  const handleUnsubscribeWebhook = async (subId) => {
    if (!window.confirm("Are you sure you want to remove this webhook listener subscription?")) return;
    setActionLoading(true);
    setError(null);
    try {
      await API.delete(`/dev/webhooks/${subId}`);
      setSuccess("Webhook unsubscribed successfully.");
      fetchWebhooks(selectedProjectId);
    } catch (err) {
      console.error(err);
      setError("Failed to delete webhook subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEvent = (event) => {
    setWebhookEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const sidebarInfo = {
    title: "Developer Portal",
    description: "Module 46 manages public REST and HMAC webhooks. Rate limits access via API tokens.",
    status: "Secure Endpoint",
    statusColor: "text-indigo-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Developer Portal
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Provision workspace tokens, configure secure event webhooks, and explore api declarations.
            </p>
          </div>
          
          <div className="flex bg-[#07080c] border border-white/5 p-1 rounded-lg">
            {[
              { id: "keys", label: "API Keys", icon: Key },
              { id: "webhooks", label: "Webhooks", icon: Webhook },
              { id: "docs", label: "REST Docs", icon: BookOpen },
              { id: "analytics", label: "Analytics", icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Notifications */}
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

        {/* Dynamic Portal Body tabs */}
        {activeTab === "keys" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generate Key Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-indigo-400" />
                  Generate API Key
                </h2>

                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Key Description Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. github-actions-ci"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || !newKeyName.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5" />
                    Create Token
                  </button>
                </form>
              </div>

              {/* Show Generated Token Warning Block */}
              {generatedKey && (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-5 backdrop-blur-xl space-y-3 text-left">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-bold text-indigo-400 border border-indigo-500/20">
                    <Shield className="h-3 w-3" /> Copy Immediately
                  </span>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    This secret token key will only be shown to you **once**. Secure it in your CI pipeline configurations.
                  </p>

                  <div className="flex items-center gap-2 bg-[#07080d] border border-white/5 rounded-lg p-2 font-mono text-[10px] text-indigo-400 select-text overflow-x-auto">
                    <span className="truncate">{generatedKey}</span>
                    <button
                      onClick={() => handleCopyText(null, generatedKey, true)}
                      className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Keys Table Column */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" />
                Active Developer Tokens
              </h2>

              {isLoadingKeys ? (
                <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying keys...
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500 font-light border border-dashed border-white/5 rounded-xl">
                  No registered active tokens. Build one above.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {apiKeys.map((key) => (
                    <div
                      key={key._id}
                      className="p-4 border border-white/5 bg-[#07080c]/60 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{key.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            key.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          ID: {key._id.substring(16)} | Created: {new Date(key.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {key.status === "active" && (
                        <button
                          onClick={() => handleRevokeKey(key._id)}
                          className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Revoke Token Access"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configure Webhook Subscription */}
            <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                Add Webhook Listener
              </h2>

              <form onSubmit={handleSubscribeWebhook} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Scope Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Payload URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.mycompany.com/webhook-receiver"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Subscribe Events
                  </label>
                  <div className="space-y-2 text-xs text-left">
                    {[
                      { id: "deployment.success", label: "Deployment Success" },
                      { id: "deployment.failed", label: "Deployment Failed" },
                      { id: "deployment.running", label: "Deployment Started" },
                      { id: "project.created", label: "Project Created" }
                    ].map((ev) => (
                      <label key={ev.id} className="flex items-center gap-2 text-gray-300 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(ev.id)}
                          onChange={() => handleToggleEvent(ev.id)}
                          className="rounded border-white/5 bg-[#08090d] text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !webhookUrl.trim() || !selectedProjectId}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
                >
                  <Webhook className="h-3.5 w-3.5" />
                  Subscribe Listener
                </button>
              </form>
            </div>

            {/* List webhooks subscribed */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Webhook className="h-4 w-4 text-indigo-400" />
                Active Webhook Triggers
              </h2>

              {isLoadingWebhooks ? (
                <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying webhooks...
                </div>
              ) : webhooks.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500 font-light border border-dashed border-white/5 rounded-xl">
                  No webhook listeners configured for the selected project scope.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {webhooks.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-4 border border-white/5 bg-[#07080c]/60 rounded-xl text-left space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono truncate max-w-[340px]">{sub.url}</span>
                        <button
                          onClick={() => handleUnsubscribeWebhook(sub._id)}
                          className="p-1 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                          title="Delete Webhook"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[8px] font-mono">
                        {sub.events.map(ev => (
                          <span key={ev} className="bg-white/5 border border-white/5 text-gray-400 px-2 py-0.5 rounded">
                            {ev}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <span>HMAC Secret: {sub.secret.substring(0, 10)}...</span>
                          <button
                            onClick={() => handleCopyText(sub._id, sub.secret)}
                            className="text-gray-500 hover:text-white p-0.5"
                            title="Copy Signing Secret"
                          >
                            {copiedId === sub._id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <span className="text-indigo-400">HMAC-SHA256 digest signature.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Nav Index */}
            <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4 text-left">
              <h2 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider">REST v1 Reference</h2>
              
              <nav className="flex flex-col gap-1 text-xs">
                {[
                  { method: "POST", path: "/v1/projects", desc: "Create Project" },
                  { method: "POST", path: "/v1/deployments", desc: "Trigger Deployment" },
                  { method: "GET", path: "/v1/deployments", desc: "Get Deployments List" },
                  { method: "GET", path: "/v1/logs/:deploymentId", desc: "Query Output Logs" },
                  { method: "POST", path: "/v1/rollback", desc: "Trigger Project Rollback" }
                ].map((ep, idx) => (
                  <div key={idx} className="p-2.5 hover:bg-white/2 rounded-lg border border-transparent hover:border-white/5 transition flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-300 font-medium">
                      <span className={`font-bold mr-1.5 ${ep.method === "GET" ? "text-emerald-400" : "text-indigo-400"}`}>{ep.method}</span>
                      {ep.path}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                ))}
              </nav>

              <div className="border-t border-white/5 pt-4 mt-2 text-[10px] text-gray-500 leading-normal flex items-start gap-1.5 font-mono">
                <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Verify authentication headers by attaching token key to `x-api-key`.</span>
              </div>
            </div>

            {/* Doc explorer Details */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  API Command reference
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Integrate CI/CD pipelines directly from GitHub Actions, GitLab CI, or terminal executors.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white font-mono">1. Trigger Deployment</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Initiates an automated container build and deployment for the requested project ID.</p>
                  
                  <pre className="bg-[#050609] border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-indigo-400 mt-3 whitespace-pre overflow-x-auto leading-relaxed select-text scrollbar-thin">
{`curl -X POST http://localhost:5000/api/dev/v1/deployments \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_TOKEN_KEY" \\
  -d '{
    "projectId": "65b9e0b8a24...6f38"
  }'`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white font-mono">2. Query Execution Output Logs</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Returns output build stdout logs streams for docker builds or environment provisioning.</p>
                  
                  <pre className="bg-[#050609] border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-indigo-400 mt-3 whitespace-pre overflow-x-auto leading-relaxed select-text scrollbar-thin">
{`curl -X GET http://localhost:5000/api/dev/v1/logs/65b9e246a...d9 \\
  -H "x-api-key: YOUR_API_TOKEN_KEY"`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Panel */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
              <div>
                <h2 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider">REST API Request Rates</h2>
                <p className="text-[10px] text-gray-500">Volume tracking across key developer integration endpoints.</p>
              </div>

              {isLoadingAnalytics ? (
                <div className="h-60 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying analytics logs...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-60 flex items-center justify-center text-xs text-gray-500 italic">
                  No active requests logs found. Trigger curl calls to start.
                </div>
              ) : (
                <div className="h-60 bg-[#07080c]/30 rounded-xl p-2 border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" stroke="#475569" fontSize={9} fontClassName="font-mono" />
                      <YAxis stroke="#475569" fontSize={9} fontClassName="font-mono" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1017", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff", fontSize: "10px" }}
                      />
                      <Bar dataKey="requests" name="API Calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Access Logs Column */}
            <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4 text-left">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                Access Log Stream
              </h2>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {isLoadingAnalytics ? (
                  <div className="h-40 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                    Scanning database logs...
                  </div>
                ) : usageLog.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-500 italic">
                    No API usage records logged.
                  </div>
                ) : (
                  usageLog.map((log) => (
                    <div
                      key={log._id}
                      className="p-3 border border-white/5 bg-[#07080c]/60 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-white">
                          <span className="text-indigo-400 uppercase mr-1">{log.method}</span>
                          {log.endpoint}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          log.statusCode < 400 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {log.statusCode}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                        <span>IP: {log.ipAddress}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DeveloperPortal;
