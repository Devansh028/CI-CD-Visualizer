import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  Server,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  AlertCircle,
  Cpu,
  Database,
  Check,
  ChevronRight,
  Archive,
  ArrowUpCircle,
  History,
  Info
} from "lucide-react";

const KubernetesDashboard = () => {
  const [clusters, setClusters] = useState([]);
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [namespaces, setNamespaces] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  
  // Cluster Form State
  const [clusterName, setClusterName] = useState("");
  const [clusterType, setClusterType] = useState("minikube");
  const [apiEndpoint, setApiEndpoint] = useState("https://127.0.0.1:8443");
  
  // Namespace Form State
  const [newNamespace, setNewNamespace] = useState("");
  
  // Helm Install Form State
  const [helmReleaseName, setHelmReleaseName] = useState("");
  const [helmChartName, setHelmChartName] = useState("nginx-ingress");
  const [helmVersion, setHelmVersion] = useState("1.4.0");
  const [helmNamespace, setHelmNamespace] = useState("default");

  // Loading / Error States
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [isLoadingNamespaces, setIsLoadingNamespaces] = useState(false);
  const [isLoadingHelm, setIsLoadingHelm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch all clusters
  const fetchClusters = async () => {
    setIsLoadingClusters(true);
    setError(null);
    try {
      const response = await API.get("/k8s/clusters");
      setClusters(response.data || []);
      if (response.data && response.data.length > 0 && !selectedClusterId) {
        setSelectedClusterId(response.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load Kubernetes clusters.");
    } finally {
      setIsLoadingClusters(false);
    }
  };

  // Fetch namespaces and Helm releases for selected cluster
  const fetchClusterDetails = async (clusterId) => {
    if (!clusterId) return;
    setIsLoadingNamespaces(true);
    setIsLoadingHelm(true);
    setError(null);
    try {
      const nsRes = await API.get(`/k8s/clusters/${clusterId}/namespaces`);
      setNamespaces(nsRes.data || []);
      
      const helmRes = await API.get(`/k8s/clusters/${clusterId}/helm`);
      setHelmReleases(helmRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load details for the selected cluster.");
    } finally {
      setIsLoadingNamespaces(false);
      setIsLoadingHelm(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  useEffect(() => {
    if (selectedClusterId) {
      fetchClusterDetails(selectedClusterId);
    } else {
      setNamespaces([]);
      setHelmReleases([]);
    }
  }, [selectedClusterId]);

  // Connect new cluster
  const handleConnectCluster = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await API.post("/k8s/clusters", {
        name: clusterName,
        type: clusterType,
        apiEndpoint
      });
      setSuccessMessage("Kubernetes Cluster connected successfully!");
      setClusterName("");
      setApiEndpoint("https://127.0.0.1:8443");
      
      // Refresh list
      const updatedClustersRes = await API.get("/k8s/clusters");
      setClusters(updatedClustersRes.data || []);
      if (response.data && response.data.cluster) {
        setSelectedClusterId(response.data.cluster._id);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.details || "Failed to connect cluster.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create namespace
  const handleCreateNamespace = async (e) => {
    e.preventDefault();
    if (!newNamespace.trim() || !selectedClusterId) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await API.post(`/k8s/clusters/${selectedClusterId}/namespaces`, {
        namespace: newNamespace.trim().toLowerCase()
      });
      setNamespaces(response.data.namespaces || []);
      setNewNamespace("");
      setSuccessMessage(`Namespace '${newNamespace}' created successfully.`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create namespace.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete namespace
  const handleDeleteNamespace = async (nsName) => {
    if (!selectedClusterId) return;
    if (["default", "kube-system", "kube-public"].includes(nsName)) {
      setError("Cannot delete system protected namespaces.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete namespace "${nsName}"?`)) return;

    setActionLoading(true);
    setError(null);
    try {
      const response = await API.delete(`/k8s/clusters/${selectedClusterId}/namespaces/${nsName}`);
      setNamespaces(response.data.namespaces || []);
      setSuccessMessage(`Namespace '${nsName}' deleted successfully.`);
    } catch (err) {
      console.error(err);
      setError("Failed to delete namespace.");
    } finally {
      setActionLoading(false);
    }
  };

  // Install Helm chart
  const handleInstallHelm = async (e) => {
    e.preventDefault();
    if (!helmReleaseName.trim() || !selectedClusterId) return;
    setActionLoading(true);
    setError(null);
    try {
      await API.post(`/k8s/clusters/${selectedClusterId}/helm`, {
        releaseName: helmReleaseName.trim().toLowerCase(),
        chartName: helmChartName,
        version: helmVersion,
        namespace: helmNamespace
      });
      setSuccessMessage(`Helm chart '${helmChartName}' installed as '${helmReleaseName}'`);
      setHelmReleaseName("");
      // Refresh Helm releases
      const helmRes = await API.get(`/k8s/clusters/${selectedClusterId}/helm`);
      setHelmReleases(helmRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.details || "Helm installation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Upgrade Helm chart
  const handleUpgradeHelm = async (namespace, releaseName, currentVersion) => {
    const nextVersion = prompt("Enter the version to upgrade to:", currentVersion);
    if (!nextVersion || nextVersion === currentVersion) return;
    
    setActionLoading(true);
    setError(null);
    try {
      await API.put(`/k8s/clusters/${selectedClusterId}/helm/${namespace}/${releaseName}`, {
        version: nextVersion
      });
      setSuccessMessage(`Helm release '${releaseName}' upgraded to version ${nextVersion}`);
      // Refresh Helm releases
      const helmRes = await API.get(`/k8s/clusters/${selectedClusterId}/helm`);
      setHelmReleases(helmRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Helm upgrade failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Rollback Helm release
  const handleRollbackHelm = async (namespace, releaseName) => {
    const revisionStr = prompt("Enter revision number to rollback to (e.g. 1):", "1");
    if (!revisionStr) return;
    const revision = parseInt(revisionStr, 10);
    if (isNaN(revision)) return;

    setActionLoading(true);
    setError(null);
    try {
      await API.post(`/k8s/clusters/${selectedClusterId}/helm/${namespace}/${releaseName}/rollback`, {
        revision
      });
      setSuccessMessage(`Helm release '${releaseName}' rolled back to revision ${revision}`);
      // Refresh Helm releases
      const helmRes = await API.get(`/k8s/clusters/${selectedClusterId}/helm`);
      setHelmReleases(helmRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Helm rollback failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Uninstall Helm release
  const handleUninstallHelm = async (namespace, releaseName) => {
    if (!window.confirm(`Are you sure you want to uninstall Helm release "${releaseName}"?`)) return;

    setActionLoading(true);
    setError(null);
    try {
      await API.delete(`/k8s/clusters/${selectedClusterId}/helm/${namespace}/${releaseName}`);
      setSuccessMessage(`Helm release '${releaseName}' uninstalled successfully.`);
      // Refresh Helm releases
      const helmRes = await API.get(`/k8s/clusters/${selectedClusterId}/helm`);
      setHelmReleases(helmRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Helm uninstall failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const sidebarInfo = {
    title: "Kubernetes Manager",
    description: "Module 40 supports connects to minikube or cloud clusters. Manages namespace isolation and Helm applications dynamically.",
    status: "Production Ready",
    statusColor: "text-indigo-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Kubernetes Cluster Manager
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Connect environments, manage namespaces, and release Helm charts to micro-service clusters.
            </p>
          </div>
          
          <button
            onClick={() => {
              fetchClusters();
              if (selectedClusterId) fetchClusterDetails(selectedClusterId);
            }}
            disabled={isLoadingClusters || actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-xs text-gray-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(isLoadingClusters || actionLoading) ? "animate-spin" : ""}`} />
            Sync Cluster Data
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400 flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Cluster Selection & Connection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of clusters */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-400" />
              Connected Clusters
            </h2>

            {isLoadingClusters ? (
              <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Loading Kubernetes clusters...
              </div>
            ) : clusters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/5 p-8 text-center">
                <Info className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <h3 className="text-xs font-bold text-gray-300">No clusters connected</h3>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                  Connect a local Minikube cluster or managed GKE/EKS/AKS services using the connector.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((c) => {
                  const isSelected = selectedClusterId === c._id;
                  return (
                    <div
                      key={c._id}
                      onClick={() => setSelectedClusterId(c._id)}
                      className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                        isSelected
                          ? "bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-950/50"
                          : "bg-[#0b0c12]/60 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          c.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-2 truncate">
                        API: {c.apiEndpoint}
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[9px] text-gray-500 uppercase tracking-wider">
                        <span>Type: {c.type}</span>
                        <span>Namespaces: {c.namespaces?.length || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connect Cluster Form */}
          <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              Connect K8s Cluster
            </h2>

            <form onSubmit={handleConnectCluster} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Cluster Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="minikube-dev"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Orchestrator Type
                </label>
                <select
                  value={clusterType}
                  onChange={(e) => setClusterType(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                >
                  <option value="minikube">Minikube (Local)</option>
                  <option value="eks">AWS EKS</option>
                  <option value="gke">Google GKE</option>
                  <option value="aks">Azure AKS</option>
                  <option value="k3s">K3s / MicroK8s</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  API Endpoint Server URL
                </label>
                <input
                  type="text"
                  required
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
              >
                {actionLoading ? "Connecting..." : "Add Cluster Connection"}
              </button>
            </form>
          </div>
        </div>

        {/* Detailed Config (Namespaces & Helm) */}
        {selectedClusterId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Namespaces Panel */}
            <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                  Namespaces
                </h2>
                {isLoadingNamespaces && <RefreshCw className="h-3.5 w-3.5 text-gray-500 animate-spin" />}
              </div>

              {/* Add Namespace Form */}
              <form onSubmit={handleCreateNamespace} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="new-namespace"
                  value={newNamespace}
                  onChange={(e) => setNewNamespace(e.target.value)}
                  className="flex-grow rounded-lg border border-white/5 bg-[#08090d] px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newNamespace.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {namespaces.map((ns) => {
                  const isProtected = ["default", "kube-system", "kube-public"].includes(ns);
                  return (
                    <div
                      key={ns}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-[#07080c]/60 text-xs font-mono"
                    >
                      <span className="text-gray-300">{ns}</span>
                      {isProtected ? (
                        <span className="text-[8px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded font-sans uppercase">
                          System
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteNamespace(ns)}
                          disabled={actionLoading}
                          className="text-rose-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Helm Releases Panel */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Archive className="h-4 w-4 text-indigo-400" />
                  Helm Releases
                </h2>
                {isLoadingHelm && <RefreshCw className="h-3.5 w-3.5 text-gray-500 animate-spin" />}
              </div>

              {/* Install New Helm Release */}
              <div className="rounded-xl border border-white/5 bg-[#08090d]/60 p-4">
                <h3 className="text-xs font-bold text-white mb-3">Install Helm Package</h3>
                <form onSubmit={handleInstallHelm} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Release Name"
                      value={helmReleaseName}
                      onChange={(e) => setHelmReleaseName(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <select
                      value={helmChartName}
                      onChange={(e) => setHelmChartName(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                    >
                      <option value="nginx-ingress">nginx-ingress</option>
                      <option value="prometheus-operator">prometheus</option>
                      <option value="grafana">grafana</option>
                      <option value="cert-manager">cert-manager</option>
                      <option value="redis-cluster">redis-ha</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={helmNamespace}
                      onChange={(e) => setHelmNamespace(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition font-mono"
                    >
                      {namespaces.map((ns) => (
                        <option key={ns} value={ns}>
                          {ns}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading || !helmReleaseName.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Install Chart
                  </button>
                </form>
              </div>

              {/* Active Helm List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {helmReleases.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500 font-light">
                    No active Helm releases installed on this cluster.
                  </div>
                ) : (
                  helmReleases.map((release) => (
                    <div
                      key={release._id}
                      className="p-4 rounded-xl border border-white/5 bg-[#07080c]/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{release.name}</span>
                          <span className="text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded font-sans uppercase">
                            {release.chart}@{release.version}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-gray-500 font-mono">
                          <span>Namespace: <span className="text-indigo-400">{release.namespace}</span></span>
                          <span>Revision: <span className="text-white">{release.revision}</span></span>
                          <span>Status: <span className="text-emerald-400">{release.status}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpgradeHelm(release.namespace, release.name, release.version)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 hover:text-white transition cursor-pointer"
                          title="Upgrade Version"
                        >
                          <ArrowUpCircle className="h-3 w-3" />
                          Upgrade
                        </button>
                        <button
                          onClick={() => handleRollbackHelm(release.namespace, release.name)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 hover:text-white transition cursor-pointer"
                          title="Rollback Revision"
                        >
                          <History className="h-3 w-3" />
                          Rollback
                        </button>
                        <button
                          onClick={() => handleUninstallHelm(release.namespace, release.name)}
                          disabled={actionLoading}
                          className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Uninstall"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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

export default KubernetesDashboard;
