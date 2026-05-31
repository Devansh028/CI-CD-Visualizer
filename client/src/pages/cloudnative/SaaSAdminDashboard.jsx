import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  ShieldAlert,
  CreditCard,
  Plus,
  RefreshCw,
  AlertCircle,
  Check,
  Building,
  Cpu,
  Database,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Sliders,
  DollarSign
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const SaaSAdminDashboard = () => {
  const [roleMode, setRoleMode] = useState("tenant"); // "tenant" | "admin"
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [billingDetails, setBillingDetails] = useState(null);
  
  // Admin stats
  const [adminStats, setAdminStats] = useState(null);

  // Loading States
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const res = await API.get("/organizations");
      setOrganizations(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedOrgId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load organizations.");
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const fetchBillingDetails = async (orgId) => {
    if (!orgId) return;
    setIsLoadingDetails(true);
    try {
      const res = await API.get(`/saas/organization/${orgId}`);
      setBillingDetails(res.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchAdminStats = async () => {
    setIsLoadingAdmin(true);
    try {
      const res = await API.get("/saas/admin/analytics");
      setAdminStats(res.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (roleMode === "tenant" && selectedOrgId) {
      fetchBillingDetails(selectedOrgId);
    } else if (roleMode === "admin") {
      fetchAdminStats();
    }
  }, [roleMode, selectedOrgId]);

  // Upgrade Plan
  const handleUpgradePlan = async (orgId, targetPlan) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await API.post(`/saas/organization/${orgId}/plan`, {
        plan: targetPlan
      });
      setSuccess(res.data.message || `Plan updated to ${targetPlan.toUpperCase()}`);
      
      // Refresh current views
      if (roleMode === "tenant") {
        fetchBillingDetails(orgId);
      } else {
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update organization billing plan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Ring Progress Bar Helper
  const QuotaProgress = ({ label, current, max, unit = "", color = "from-indigo-500 to-purple-600" }) => {
    const pct = Math.min(100, Math.round((current / max) * 100)) || 0;
    return (
      <div className="bg-[#07080c]/60 border border-white/5 rounded-xl p-4 space-y-3 text-left">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-gray-400 font-sans">{label}</span>
          <span className="text-white font-bold">
            {current} / {max} {unit}
          </span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color}`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
        <div className="text-[9px] text-right font-mono text-gray-500">{pct}% Utilization</div>
      </div>
    );
  };

  const getPlanGradient = (plan) => {
    switch (plan) {
      case "enterprise":
        return "from-purple-600 to-pink-600 shadow-purple-900/30";
      case "pro":
        return "from-indigo-600 to-blue-600 shadow-indigo-950/40";
      default:
        return "from-slate-700 to-slate-800 shadow-slate-900/20";
    }
  };

  const COLORS = ["#f59e0b", "#6366f1", "#a855f7"];

  const sidebarInfo = {
    title: "SaaS Suite",
    description: "Module 49 monitors organization resource utilization and handles Free/Pro/Enterprise plan quota limits.",
    status: "Active Quotas",
    statusColor: "text-indigo-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              SaaS Admin & Billing Dashboard
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Administer customer tenant resource thresholds and organization tier plan subscriptions.
            </p>
          </div>
          
          {/* Role mode selection tabs */}
          <div className="flex bg-[#07080c] border border-white/5 p-1 rounded-lg">
            <button
              onClick={() => setRoleMode("tenant")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                roleMode === "tenant" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Billing & Quotas
            </button>
            <button
              onClick={() => setRoleMode("admin")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                roleMode === "admin" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Global Operator (Admin)
            </button>
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

        {/* Tenant Billing View */}
        {roleMode === "tenant" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left part: plan callout & upgrades */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Organization select */}
              <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-indigo-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Organization Scope</span>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="bg-transparent text-xs text-white font-bold focus:outline-none block mt-0.5 border border-white/5 rounded px-2 py-0.5"
                    >
                      <option value="">Select organization...</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id} className="bg-slate-950 text-white">
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {isLoadingOrgs && <RefreshCw className="h-3.5 w-3.5 text-gray-500 animate-spin" />}
              </div>

              {/* Active Plan Detail */}
              {billingDetails && (
                <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-5">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Active Plan Subscription</span>
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getPlanGradient(billingDetails.plan)} flex items-center justify-center font-bold text-sm uppercase text-white shadow-lg`}>
                        {billingDetails.plan.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white capitalize">{billingDetails.plan} Plan</h3>
                        <span className="text-[10px] text-gray-400">Tenant ID: {billingDetails.organizationId?.substring(18)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Plan pricing description cards */}
                  <div className="space-y-3 pt-3 border-t border-white/5 text-left">
                    <h4 className="text-[10px] uppercase font-bold text-gray-400 font-mono">Upgrade Plan Options</h4>
                    
                    {[
                      { id: "free", name: "Free Tier", price: "$0", desc: "For hobby developers & small sandboxes." },
                      { id: "pro", name: "Pro Plan", price: "$49/mo", desc: "For scaling team deployments & APIs." },
                      { id: "enterprise", name: "Enterprise", price: "$299/mo", desc: "For large cluster operations & high RAM." }
                    ].map((p) => {
                      const isActive = billingDetails.plan === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => !isActive && handleUpgradePlan(selectedOrgId, p.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isActive
                              ? "bg-indigo-950/20 border-indigo-500/40"
                              : "bg-[#07080c]/60 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {p.name}
                              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>}
                            </div>
                            <span className="text-[9px] text-gray-500 block mt-0.5">{p.desc}</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-indigo-400">{p.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right part: Quota progress lists */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  Resource Allocation Quotas
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Physical CPU cores, Memory allocations, and build bandwidth thresholds.</p>
              </div>

              {isLoadingDetails ? (
                <div className="h-48 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying tenant quotas...
                </div>
              ) : !billingDetails ? (
                <div className="text-center py-20 text-xs text-gray-500">
                  Select or create an organization first.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <QuotaProgress
                    label="Deployment Runners"
                    current={billingDetails.usage.deployments}
                    max={billingDetails.quotas.maxDeployments}
                    unit="Units"
                  />
                  <QuotaProgress
                    label="Virtual CPU Cores"
                    current={billingDetails.usage.cpu}
                    max={billingDetails.quotas.maxCpu}
                    unit="Cores"
                    color="from-purple-500 to-pink-600"
                  />
                  <QuotaProgress
                    label="RAM Allocations"
                    current={billingDetails.usage.memory}
                    max={billingDetails.quotas.maxMemory}
                    unit="GB"
                    color="from-blue-500 to-indigo-600"
                  />
                  <QuotaProgress
                    label="Storage Limit"
                    current={Math.round(billingDetails.usage.storage || 2)}
                    max={billingDetails.quotas.maxStorage}
                    unit="GB"
                    color="from-amber-500 to-orange-600"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global SaaS Operator Admin View */}
        {roleMode === "admin" && (
          <div className="flex flex-col gap-8">
            {/* Metric widgets */}
            {adminStats && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Total Tenant Registries</span>
                  <div className="text-3xl font-extrabold text-white mt-3 font-mono">{adminStats.totalTenants}</div>
                </div>

                <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Aggregate VM CPUs</span>
                  <div className="text-3xl font-extrabold text-white mt-3 font-mono flex items-center gap-1.5">
                    <Cpu className="h-5 w-5 text-indigo-400" />
                    {adminStats.activeResources?.cpu || 0} Cores
                  </div>
                </div>

                <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Aggregate RAM allocated</span>
                  <div className="text-3xl font-extrabold text-white mt-3 font-mono flex items-center gap-1.5">
                    <Database className="h-5 w-5 text-indigo-400" />
                    {adminStats.activeResources?.memory || 0} GB
                  </div>
                </div>

                <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Deployments Online</span>
                  <div className="text-3xl font-extrabold text-white mt-3 font-mono flex items-center gap-1.5">
                    <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
                    {adminStats.activeResources?.deployments || 0} Runs
                  </div>
                </div>
              </div>
            )}

            {/* Distribution chart & Tenants listing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pie Chart of Plan distribution */}
              <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4 text-left">
                <h2 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider">Plan Distribution Tier</h2>
                
                {isLoadingAdmin ? (
                  <div className="h-44 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                    Scanning plans...
                  </div>
                ) : adminStats?.plansDistribution ? (
                  <div className="h-44 bg-[#07080c]/30 rounded-xl p-2 border border-white/5 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={adminStats.plansDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {adminStats.plansDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0e1017", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                          itemStyle={{ fontSize: "10px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legends */}
                    <div className="space-y-1.5 pl-4 text-[10px] font-mono text-gray-400 shrink-0">
                      {adminStats.plansDistribution.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span>{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Tenants details Table */}
              <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4 text-left">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-400" />
                  Operator Tenant Registry
                </h2>

                {isLoadingAdmin && !adminStats ? (
                  <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                    Loading tenants list...
                  </div>
                ) : !adminStats || adminStats.tenantsList?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No active organizations mapped.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full border-collapse text-left text-xs text-gray-400">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500">
                          <th className="py-2">Org Name</th>
                          <th className="py-2">Tier</th>
                          <th className="py-2">CPU (Used/Limit)</th>
                          <th className="py-2">RAM (Used/Limit)</th>
                          <th className="py-2">Runners</th>
                          <th className="py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminStats.tenantsList.map((tenant) => (
                          <tr key={tenant._id} className="hover:bg-white/2">
                            <td className="py-3 font-bold text-white">
                              {tenant.organizationId?.name || "Dev Org"}
                            </td>
                            <td className="py-3 font-mono text-[10px] uppercase font-bold text-indigo-400">
                              {tenant.plan}
                            </td>
                            <td className="py-3 font-mono">
                              {tenant.usage.cpu} / {tenant.quotas.maxCpu}
                            </td>
                            <td className="py-3 font-mono">
                              {tenant.usage.memory}G / {tenant.quotas.maxMemory}G
                            </td>
                            <td className="py-3 font-mono">
                              {tenant.usage.deployments} / {tenant.quotas.maxDeployments}
                            </td>
                            <td className="py-3 text-right">
                              <select
                                value={tenant.plan}
                                onChange={(e) => handleUpgradePlan(tenant.organizationId?._id || tenant.organizationId, e.target.value)}
                                disabled={actionLoading}
                                className="bg-[#07080c] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                              >
                                <option value="free">FREE</option>
                                <option value="pro">PRO</option>
                                <option value="enterprise">ENTERPRISE</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SaaSAdminDashboard;
