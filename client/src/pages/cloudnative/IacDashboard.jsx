import React, { useEffect, useState, useRef } from "react";
import AppLayout from "../../components/layout/AppLayout";
import API from "../../api/axios";
import {
  Code,
  Play,
  Terminal,
  RefreshCw,
  AlertCircle,
  Check,
  FolderOpen,
  Settings,
  ChevronRight,
  Database,
  Trash2,
  FileCode,
  Activity,
  User
} from "lucide-react";

const IacDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  
  // Trigger Form State
  const [iacType, setIacType] = useState("terraform");
  const [operation, setOperation] = useState("plan");
  const [templateName, setTemplateName] = useState("aws-ec2");

  // Active file preview
  const [activeFileTab, setActiveFileTab] = useState("");

  // Loading / Polling States
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const terminalEndRef = useRef(null);

  // Fetch projects
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
      setError("Failed to load active projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch execution history for selected project
  const fetchHistory = async (projectId) => {
    if (!projectId) return;
    setIsLoadingHistory(true);
    try {
      const res = await API.get(`/iac/project/${projectId}`);
      setExecutions(res.data || []);
      if (res.data && res.data.length > 0) {
        // Auto select first one if nothing is selected
        if (!selectedExecution) {
          setSelectedExecution(res.data[0]);
        } else {
          // Keep existing selection updated
          const updated = res.data.find(e => e._id === selectedExecution._id);
          if (updated) setSelectedExecution(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchHistory(selectedProjectId);
    } else {
      setExecutions([]);
      setSelectedExecution(null);
    }
  }, [selectedProjectId]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedExecution?.logs]);

  // Set default active file when selection changes
  useEffect(() => {
    if (selectedExecution?.configFiles) {
      const keys = Object.keys(selectedExecution.configFiles);
      if (keys.length > 0) {
        setActiveFileTab(keys[0]);
      }
    } else {
      setActiveFileTab("");
    }
  }, [selectedExecution]);

  // Polling execution status if running
  useEffect(() => {
    let interval;
    const hasRunningJob = executions.some(e => e.status === "running");
    
    if (hasRunningJob && selectedProjectId) {
      interval = setInterval(() => {
        fetchHistory(selectedProjectId);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [executions, selectedProjectId]);

  // Trigger Operation
  const handleTriggerOperation = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await API.post("/iac/trigger", {
        projectId: selectedProjectId,
        iacType,
        operation,
        templateName
      });
      setSuccess(`${iacType.toUpperCase()} ${operation} operation triggered!`);
      
      // Immediately refresh list
      await fetchHistory(selectedProjectId);
      
      // Auto select the new running execution
      if (res.data && res.data.executionId) {
        const checkRes = await API.get(`/iac/project/${selectedProjectId}`);
        const found = checkRes.data.find(x => x._id === res.data.executionId);
        if (found) setSelectedExecution(found);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.details || "Failed to trigger IaC execution.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "running":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const sidebarInfo = {
    title: "Infrastructure as Code",
    description: "Module 42 provides automated Terraform plan/apply operations. Renders configuration declarations dynamically.",
    status: "Verified",
    statusColor: "text-indigo-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Infrastructure as Code Planner
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">
              Synthesize and run automated Terraform or Pulumi templates to provision server environments.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono">Active Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#07080d] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form & Manifest Viewer */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Action Trigger Card */}
            <div className="rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Play className="h-4 w-4 text-indigo-400" />
                Trigger IaC Execution
              </h2>

              <form onSubmit={handleTriggerOperation} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    IaC Tooling
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-white/5 bg-[#08090d]">
                    <button
                      type="button"
                      onClick={() => setIacType("terraform")}
                      className={`py-1.5 rounded text-[10px] font-bold transition duration-200 cursor-pointer ${
                        iacType === "terraform" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Terraform
                    </button>
                    <button
                      type="button"
                      onClick={() => setIacType("pulumi")}
                      className={`py-1.5 rounded text-[10px] font-bold transition duration-200 cursor-pointer ${
                        iacType === "pulumi" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Pulumi
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Infrastructure Template
                  </label>
                  <select
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#08090d] px-3.5 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition"
                  >
                    <option value="aws-ec2">AWS Virtual Machine (EC2)</option>
                    <option value="aws-s3">AWS Object Storage (S3)</option>
                    <option value="gcp-gke">Google Kubernetes Cluster (GKE)</option>
                    <option value="azure-vm">Azure Computing Core (VM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Command Operation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["plan", "apply", "destroy"].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOperation(op)}
                        className={`py-1.5 rounded-lg border text-xs font-semibold capitalize transition ${
                          operation === op
                            ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                            : "border-white/5 bg-[#08090d] text-gray-400 hover:text-white"
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !selectedProjectId}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
                >
                  <Code className="h-3.5 w-3.5" />
                  Run {iacType === "terraform" ? "Terraform" : "Pulumi"} {operation}
                </button>
              </form>
            </div>

            {/* Generated Manifest preview */}
            {selectedExecution?.configFiles && (
              <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-5 backdrop-blur-xl flex flex-col gap-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-indigo-400" />
                  Manifest Declaration
                </h3>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2 text-[10px] font-mono">
                  {Object.keys(selectedExecution.configFiles).map((filename) => (
                    <button
                      key={filename}
                      onClick={() => setActiveFileTab(filename)}
                      className={`px-2 py-1 rounded border transition ${
                        activeFileTab === filename
                          ? "bg-white/5 border-indigo-500/50 text-indigo-400"
                          : "border-transparent text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {filename}
                    </button>
                  ))}
                </div>

                {/* Code viewer */}
                <pre className="bg-[#050609] border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-gray-300 overflow-auto max-h-80 text-left whitespace-pre leading-relaxed select-text scrollbar-thin">
                  <code>{selectedExecution.configFiles[activeFileTab] || ""}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Terminal output & execution history */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Terminal logs */}
            <div className="rounded-2xl border border-white/5 bg-[#050609] shadow-2xl overflow-hidden flex flex-col h-[340px]">
              {/* Terminal header */}
              <div className="bg-[#0e1017]/80 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold text-gray-300 font-mono">execution_log_terminal</span>
                </div>
                {selectedExecution && (
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${getStatusStyle(selectedExecution.status)}`}>
                    {selectedExecution.status}
                  </span>
                )}
              </div>

              {/* Terminal screen */}
              <div className="p-4 flex-grow overflow-y-auto text-left font-mono text-[11px] space-y-1.5 leading-relaxed selection:bg-indigo-500/30 select-text scrollbar-thin">
                {!selectedExecution ? (
                  <div className="text-gray-500 text-center py-24 italic">
                    Select an execution runner history item below to inspect stdout terminal streams.
                  </div>
                ) : selectedExecution.logs?.length === 0 ? (
                  <div className="text-gray-500 italic">Initializing runner stdout stream...</div>
                ) : (
                  selectedExecution.logs.map((log, index) => {
                    const isError = log.level === "error";
                    const isWarn = log.level === "warn";
                    return (
                      <div
                        key={index}
                        className={isError ? "text-rose-400 font-bold" : isWarn ? "text-amber-400 font-bold" : "text-emerald-400"}
                      >
                        <span className="text-slate-600 mr-2">[{index + 1}]</span>
                        {log.message}
                      </div>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* History Table */}
            <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 backdrop-blur-xl flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-indigo-400" />
                Execution History
              </h2>

              {isLoadingHistory && executions.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-gray-500 animate-pulse">
                  Querying IaC runs...
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-light">
                  No registered execution logs. Trigger plan actions above to start.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-gray-400">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500">
                        <th className="py-2.5 font-bold">Runner ID</th>
                        <th className="py-2.5 font-bold">Type</th>
                        <th className="py-2.5 font-bold">Operation</th>
                        <th className="py-2.5 font-bold">Status</th>
                        <th className="py-2.5 font-bold">Triggered By</th>
                        <th className="py-2.5 font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {executions.map((e) => {
                        const isSelected = selectedExecution?._id === e._id;
                        return (
                          <tr
                            key={e._id}
                            onClick={() => setSelectedExecution(e)}
                            className={`hover:bg-white/2 cursor-pointer transition ${
                              isSelected ? "bg-white/5 text-white" : ""
                            }`}
                          >
                            <td className="py-3 font-mono text-[10px] font-bold text-indigo-400">
                              {e._id.substring(18)}
                            </td>
                            <td className="py-3 uppercase font-bold text-[10px]">{e.type}</td>
                            <td className="py-3 capitalize">{e.operation}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase ${getStatusStyle(e.status)}`}>
                                {e.status}
                              </span>
                            </td>
                            <td className="py-3 flex items-center gap-1.5">
                              <User className="h-3 w-3 text-slate-500" />
                              {e.triggeredBy?.name || "API Dev"}
                            </td>
                            <td className="py-3 font-mono text-[10px] text-gray-500">
                              {new Date(e.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default IacDashboard;
