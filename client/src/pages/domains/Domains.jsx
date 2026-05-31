import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDomainStore } from "../../store/domainStore";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import {
  Globe,
  Plus,
  Trash2,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Layers,
  LogOut,
  Server,
  Activity,
  AlertCircle,
  HardDrive
} from "lucide-react";
import NotificationBell from "../../components/notifications/NotificationBell";
import AppLayout from "../../components/layout/AppLayout";

const Domains = () => {
  const { domains, fetchDomains, createDomain, deleteDomain, isLoading, error, clearError } = useDomainStore();
  const { projects, fetchProjects } = useProjectStore();
  const { user, logout } = useAuthStore();

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [routingType, setRoutingType] = useState("subdomain"); // "subdomain" | "custom"
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchDomains();
    fetchProjects();
    clearError();
  }, [fetchDomains, fetchProjects, clearError]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const payload = {
        projectId: selectedProjectId,
      };

      if (routingType === "subdomain") {
        if (!subdomain) return;
        payload.subdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
      } else {
        if (!customDomain) return;
        payload.domain = customDomain.toLowerCase().trim();
      }

      await createDomain(payload);
      // Reset form on success
      setSubdomain("");
      setCustomDomain("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, domainStr) => {
    if (window.confirm(`Are you sure you want to delete the routing mapping for "${domainStr}"? This will reload the Nginx proxy immediately.`)) {
      try {
        await deleteDomain(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Find target project deployPort helper
  const getSelectedProjectPort = () => {
    const proj = projects.find(p => p._id === selectedProjectId);
    return proj ? proj.deployPort : null;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-emerald-500",
      inactive: "bg-gray-500",
      error: "bg-rose-500 animate-pulse",
    };
    return colors[status] || "bg-gray-500";
  };

  const sidebarInfo = {
    title: "Visualizer Info",
    description: "Module 6 implements hot-reloaded Nginx reverse proxies to automatically map project deployments to subdomains or custom domains.",
    status: "Verified",
    statusColor: "text-purple-500",
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      {/* Content Area */}
      <section className="w-full flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Domains Manager</h1>
            <p className="text-xs text-gray-400 font-light mt-1">Configure and manage Nginx reverse proxy routes for project containers</p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl sticky top-24">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-purple-400" />
                  Add Domain Mapping
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Select Project */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Target Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200"
                    >
                      <option value="">Select a project...</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Routing Type */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Routing Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-white/5 bg-[#08090d]">
                      <button
                        type="button"
                        onClick={() => setRoutingType("subdomain")}
                        className={`py-1.5 rounded text-[10px] font-bold transition duration-200 cursor-pointer ${
                          routingType === "subdomain"
                            ? "bg-purple-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Subdomain
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoutingType("custom")}
                        className={`py-1.5 rounded text-[10px] font-bold transition duration-200 cursor-pointer ${
                          routingType === "custom"
                            ? "bg-purple-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Custom Domain
                      </button>
                    </div>
                  </div>

                  {/* Conditional inputs */}
                  {routingType === "subdomain" ? (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Subdomain
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value)}
                          placeholder="my-awesome-app"
                          required
                          className="flex-grow rounded-l-lg border border-white/5 border-r-0 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200"
                        />
                        <span className="rounded-r-lg border border-white/5 bg-white/5 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-l-0">
                          .localhost
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Custom Domain
                      </label>
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="example.com"
                        required
                        className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition duration-200"
                      />
                    </div>
                  )}

                  {/* Target Port Notice */}
                  {selectedProjectId && (
                    <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 p-3 text-[11px] font-light text-indigo-300 leading-normal flex items-start gap-2">
                      <Server className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                      <div>
                        Target Port configured automatically:{" "}
                        <span className="font-bold text-white font-mono">{getSelectedProjectPort()}</span>
                        {" "}inside container network.
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !selectedProjectId}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition duration-200 cursor-pointer"
                  >
                    Add Routing Rule
                  </button>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-400" />
                  Active Routing Rules
                </h2>

                {isLoading && domains.length === 0 ? (
                  <div className="h-48 rounded-xl border border-white/5 bg-white/2 animate-pulse flex items-center justify-center text-xs text-gray-500">
                    Loading domains...
                  </div>
                ) : domains.length === 0 ? (
                  /* Empty state */
                  <div className="rounded-xl border border-dashed border-white/5 p-12 text-center flex flex-col items-center justify-center">
                    <Globe className="h-8 w-8 text-gray-600 mb-3" />
                    <h3 className="text-xs font-bold text-gray-300">No active domain routes</h3>
                    <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                      Successful deployments automatically configure subdomains. You can also map custom entry points here.
                    </p>
                  </div>
                ) : (
                  /* List */
                  <div className="divide-y divide-white/5">
                    {domains.map((d) => {
                      const domainUrl = d.domain ? `http://${d.domain}` : `http://${d.subdomain}.localhost`;
                      return (
                        <div key={d._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="space-y-1.5">
                            {/* Target Host URL */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={domainUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-white hover:text-purple-400 flex items-center gap-1.5 transition duration-200"
                              >
                                {d.domain ? d.domain : `${d.subdomain}.localhost`}
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                              </a>
                              <span className="text-[10px] font-semibold text-gray-400 uppercase bg-[#08090d] border border-white/5 px-2 py-0.5 rounded">
                                {d.projectId?.name || "Unknown Project"}
                              </span>
                            </div>

                            {/* Node Target Info */}
                            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                              <div className="flex items-center gap-1">
                                <Server className="h-3.5 w-3.5" />
                                <span>Proxying $\to$ </span>
                                <span className="text-indigo-400">cicd-project-{d.projectId?._id.substring(18)}:{d.targetPort}</span>
                              </div>
                              {d.containerId && (
                                <div>
                                  ID: <span className="text-gray-400">{d.containerId.substring(0, 10)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {/* Status */}
                            <div className="flex items-center gap-1.5 bg-[#08090d] border border-white/5 px-2 py-0.5 rounded-full">
                              <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(d.status)}`}></span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                {d.status}
                              </span>
                            </div>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(d._id, domainUrl)}
                              className="p-1.5 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-white transition duration-200 cursor-pointer"
                              title="Copy URL"
                            >
                              {copiedId === d._id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDelete(d._id, d.domain ? d.domain : `${d.subdomain}.localhost`)}
                              className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition duration-200 cursor-pointer"
                              title="Remove Route"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
    </AppLayout>
  );
};

export default Domains;
