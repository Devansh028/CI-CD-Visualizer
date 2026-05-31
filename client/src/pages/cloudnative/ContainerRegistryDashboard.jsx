import React, { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  Archive,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  FolderOpen,
  Database,
  ArrowRightLeft,
  Copy,
  Download,
  Info,
  Server
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const ContainerRegistryDashboard = () => {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoImages, setRepoImages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Repository Creation State
  const [repoName, setRepoName] = useState("");
  const [repoDesc, setRepoDesc] = useState("");

  // Tag Creation State
  const [tagInput, setTagInput] = useState("");
  const [tagSizeMb, setTagSizeMb] = useState("45");

  // Sync Docker Hub State
  const [syncDirection, setSyncDirection] = useState("pull");
  const [dockerHubRepo, setDockerHubRepo] = useState("");

  // Loading States
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchRepositories = async () => {
    setIsLoadingRepos(true);
    try {
      const res = await API.get("/registry/repositories");
      setRepositories(res.data || []);
      if (res.data && res.data.length > 0 && !selectedRepo) {
        setSelectedRepo(res.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load registry repositories.");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const fetchRepoImages = async (repoId) => {
    if (!repoId) return;
    setIsLoadingImages(true);
    try {
      const res = await API.get(`/registry/repositories/${repoId}/images`);
      setRepoImages(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await API.get("/registry/analytics");
      setAnalytics(res.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchRepoImages(selectedRepo._id);
    } else {
      setRepoImages([]);
    }
  }, [selectedRepo]);

  const handleCopyDigest = (id, digest) => {
    navigator.clipboard.writeText(digest);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Create repository
  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await API.post("/registry/repositories", {
        name: repoName.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
        description: repoDesc
      });
      setSuccess(`Repository '${repoName}' registered successfully.`);
      setRepoName("");
      setRepoDesc("");
      
      // Refresh repos
      const updatedRes = await API.get("/registry/repositories");
      setRepositories(updatedRes.data || []);
      if (res.data && res.data.repository) {
        setSelectedRepo(res.data.repository);
      }
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      setError("Failed to create repository.");
    } finally {
      setActionLoading(false);
    }
  };

  // Push new image tag
  const handlePushTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim() || !selectedRepo) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const sizeBytes = Number(tagSizeMb) * 1024 * 1024;
      await API.post(`/registry/repositories/${selectedRepo._id}/images`, {
        tag: tagInput.trim().toLowerCase(),
        sizeBytes
      });
      setSuccess(`Tag '${tagInput}' pushed successfully to ${selectedRepo.name}.`);
      setTagInput("");
      
      // Refresh images & repositories
      fetchRepoImages(selectedRepo._id);
      
      // Refresh list to update repository size display
      const repoRes = await API.get("/registry/repositories");
      setRepositories(repoRes.data || []);
      const updatedSelected = repoRes.data.find(r => r._id === selectedRepo._id);
      if (updatedSelected) setSelectedRepo(updatedSelected);
      
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      setError("Failed to push image tag.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete image tag
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this tag? This operation is permanent.")) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await API.delete(`/registry/images/${imageId}`);
      setSuccess("Image tag deleted successfully.");
      
      // Refresh images
      fetchRepoImages(selectedRepo._id);
      
      // Refresh repos to update size display
      const repoRes = await API.get("/registry/repositories");
      setRepositories(repoRes.data || []);
      const updatedSelected = repoRes.data.find(r => r._id === selectedRepo._id);
      if (updatedSelected) setSelectedRepo(updatedSelected);
      
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      setError("Failed to delete image tag.");
    } finally {
      setActionLoading(false);
    }
  };

  // Docker Hub Sync
  const handleSyncDockerHub = async (e) => {
    e.preventDefault();
    if (!dockerHubRepo.trim() || !selectedRepo) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await API.post("/registry/sync", {
        direction: syncDirection,
        repoName: selectedRepo.name,
        dockerHubRepo: dockerHubRepo.trim()
      });
      setSuccess(res.data.message || "Docker Hub sync completed.");
      setDockerHubRepo("");
      
      // Refresh details
      fetchRepoImages(selectedRepo._id);
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      setError("Sync operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Formats bytes into human readable format
  const formatBytes = (bytes) => {
    if (!bytes) return "0.00 B";
    const k = 1024;
    const dm = 2;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const sidebarInfo = {
    title: "Container Registry",
    description: "Module 43 provides a private image registry explorer, offering image tag tracking, mirrors, and storage charts.",
    status: "Secure (TLS)",
    statusColor: "text-purple-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Private Container Registry
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Store, mirror, and analyze Docker image tag versioning in your secure cloud ecosystem.
            </p>
          </div>
          
          <button
            onClick={() => {
              fetchRepositories();
              fetchAnalytics();
              if (selectedRepo) fetchRepoImages(selectedRepo._id);
            }}
            disabled={isLoadingRepos || isLoadingAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-xs text-gray-300 hover:text-white transition duration-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Registry
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

        {/* Stats & Growth Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Analytics Cards */}
            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider">Total Repositories</span>
                <div className="text-3xl font-extrabold text-white mt-3 font-mono">{analytics.totalRepositories}</div>
              </div>
              
              <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider">Storage Occupancy</span>
                <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                  {analytics.totalStorageMb > 1024 
                    ? `${(analytics.totalStorageMb / 1024).toFixed(2)} GB` 
                    : `${analytics.totalStorageMb} MB`}
                </div>
              </div>

              <div className="bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wider">Image Pull Requests</span>
                <div className="text-3xl font-extrabold text-white mt-3 font-mono flex items-center gap-2">
                  <Download className="h-6 w-6 text-purple-400 animate-bounce" />
                  {analytics.totalPulls}
                </div>
              </div>
            </div>

            {/* Growth Area Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
              <div>
                <h2 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider">7-Day Storage Utilization Growth</h2>
                <p className="text-[10px] text-gray-500">Registry size accumulation pattern in Megabytes.</p>
              </div>

              <div className="h-44 bg-[#07080c]/30 rounded-xl p-2 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.growthStats}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="label" stroke="#475569" fontSize={9} fontClassName="font-mono" />
                    <YAxis stroke="#475569" fontSize={9} fontClassName="font-mono" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1017", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                      labelStyle={{ color: "#fff", fontSize: "10px" }}
                      itemStyle={{ color: "#a855f7", fontSize: "10px" }}
                    />
                    <Area type="monotone" dataKey="sizeMb" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Repositories / Tags Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Repositories list Column */}
          <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-purple-400" />
              Registry Repositories
            </h2>

            {/* Form */}
            <form onSubmit={handleCreateRepo} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="flex-grow rounded-lg border border-white/5 bg-[#08090d] px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={actionLoading || !repoName.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Create
              </button>
            </form>

            <div className="space-y-2.5 overflow-y-auto max-h-96 pr-1">
              {isLoadingRepos ? (
                <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying repositories...
                </div>
              ) : repositories.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500 font-light border border-dashed border-white/5 rounded-xl">
                  No repositories available.
                </div>
              ) : (
                repositories.map((r) => {
                  const isSelected = selectedRepo?._id === r._id;
                  return (
                    <div
                      key={r._id}
                      onClick={() => setSelectedRepo(r)}
                      className={`p-3.5 rounded-xl border transition text-left cursor-pointer ${
                        isSelected
                          ? "bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/40"
                          : "bg-[#07080c]/60 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-gray-400" />
                        registry.ccv.local/{r.name}
                      </span>
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mt-3 pt-2 border-t border-white/5">
                        <span>Pulls: {r.pullCount}</span>
                        <span>Size: {formatBytes(r.storageBytes)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Repo tag digests & Docker Hub Mirroring details */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-6">
            {selectedRepo ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono">
                      registry.ccv.local/{selectedRepo.name}
                    </h2>
                    <span className="text-[10px] text-gray-500">Repository storage usage: {formatBytes(selectedRepo.storageBytes)}</span>
                  </div>

                  {/* Add Tag Inline Form */}
                  <form onSubmit={handlePushTag} className="flex gap-2 bg-[#07080c] border border-white/5 rounded-lg p-1">
                    <input
                      type="text"
                      required
                      placeholder="tag: e.g. v1.2.0"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="rounded-lg bg-[#08090d] border border-white/5 px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none w-28 font-mono"
                    />
                    <input
                      type="number"
                      required
                      value={tagSizeMb}
                      onChange={(e) => setTagSizeMb(e.target.value)}
                      className="rounded-lg bg-[#08090d] border border-white/5 px-2 py-1 text-xs text-white focus:outline-none w-14 font-mono"
                      title="Size in MB"
                    />
                    <button
                      type="submit"
                      disabled={actionLoading || !tagInput.trim()}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer transition"
                    >
                      Push
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left part: list of images */}
                  <div className="md:col-span-2 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {isLoadingImages ? (
                      <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                        Scanning tags...
                      </div>
                    ) : repoImages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-gray-500 font-light border border-dashed border-white/5 rounded-xl">
                        No image tags uploaded. Trigger push to start.
                      </div>
                    ) : (
                      repoImages.map((img) => (
                        <div
                          key={img._id}
                          className="p-3 border border-white/5 bg-[#07080c]/60 rounded-xl space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white font-mono">tag: {img.tag}</span>
                            <button
                              onClick={() => handleDeleteImage(img._id)}
                              disabled={actionLoading}
                              className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>Digest: {img.digest.substring(0, 15)}...</span>
                              <button
                                onClick={() => handleCopyDigest(img._id, img.digest)}
                                className="text-gray-500 hover:text-white p-0.5"
                                title="Copy Digest SHA"
                              >
                                {copiedId === img._id ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <span>Size: {formatBytes(img.sizeBytes)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right part: Docker Hub mirror sync */}
                  <div className="md:col-span-1 border border-white/5 bg-[#07080c]/60 rounded-xl p-4 flex flex-col justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ArrowRightLeft className="h-4 w-4 text-purple-400" />
                      Docker Hub Sync
                    </h3>

                    <form onSubmit={handleSyncDockerHub} className="space-y-3 mt-4">
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-gray-500 mb-1">Direction</label>
                        <select
                          value={syncDirection}
                          onChange={(e) => setSyncDirection(e.target.value)}
                          className="w-full rounded bg-[#08090d] border border-white/5 px-2 py-1 text-[10px] text-white focus:outline-none"
                        >
                          <option value="pull">Mirror FROM Hub</option>
                          <option value="push">Mirror TO Hub</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase font-bold text-gray-500 mb-1">Target Registry Repo</label>
                        <input
                          type="text"
                          required
                          placeholder="library/nginx"
                          value={dockerHubRepo}
                          onChange={(e) => setDockerHubRepo(e.target.value)}
                          className="w-full rounded bg-[#08090d] border border-white/5 px-2 py-1 text-[10px] text-white focus:outline-none font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading || !dockerHubRepo.trim()}
                        className="w-full flex items-center justify-center gap-1 rounded bg-purple-600 hover:bg-purple-500 text-white py-1.5 text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? "Syncing..." : "Execute Mirror Sync"}
                      </button>
                    </form>

                    <div className="mt-4 flex items-start gap-1 text-[9px] text-gray-500 font-mono leading-normal">
                      <Info className="h-3 w-3 text-purple-400 shrink-0 mt-0.5" />
                      <span>Sync verifies container signatures and mirrors tags asynchronously.</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-24 text-xs text-gray-500 italic">
                Select a repository folder to inspect image digests and synchronize mirrors.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContainerRegistryDashboard;
