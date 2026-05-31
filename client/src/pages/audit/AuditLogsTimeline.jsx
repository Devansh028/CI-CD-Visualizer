import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getAuditLogs } from "../../api/auditApi";
import { getProjects } from "../../api/projectApi";
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Filter, 
  ArrowRight,
  Loader2,
  Clock,
  User as UserIcon,
  Tag,
  Activity,
  Code
} from "lucide-react";

const AuditLogsTimeline = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter parameters
  const [filterUser, setFilterUser] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [projectsList, setProjectsList] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const actionsList = [
    "Login",
    "Logout",
    "User Invite",
    "Project Created",
    "Project Updated",
    "Deployment Started",
    "Deployment Failed",
    "Deployment Success",
    "Rollback Started",
    "Rollback Success",
    "Domain Added",
    "Domain Removed",
    "Environment Updated",
    "Secret Created"
  ];

  useEffect(() => {
    loadProjects();
    fetchLogs();
  }, [currentPage]);

  const loadProjects = async () => {
    try {
      const list = await getProjects();
      setProjectsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: 15,
        action: filterAction || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      // If user ID or project ID is set
      if (filterUser.trim()) params.userId = filterUser.trim();
      if (filterProject.trim()) params.resourceId = filterProject.trim();

      const data = await getAuditLogs(params);
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading audit logs:", err);
      setIsLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilterUser("");
    setFilterProject("");
    setFilterAction("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    // Timeout to let state updates propagate
    setTimeout(fetchLogs, 50);
  };

  const getActionColor = (action) => {
    const act = action.toLowerCase();
    if (act.includes("success")) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (act.includes("failed")) return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    if (act.includes("create") || act.includes("added")) return "bg-purple-500/10 border-purple-500/20 text-purple-400";
    if (act.includes("update") || act.includes("secret")) return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
    if (act.includes("login") || act.includes("logout")) return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
    return "bg-white/5 border-white/5 text-gray-400";
  };

  const toggleExpandLog = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <AppLayout>
      <div className="relative min-h-screen">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/5 blur-[130px] pointer-events-none"></div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-purple-500" />
            System Audit Trail
          </h1>
          <p className="text-xs text-gray-400 font-light mt-1">Enterprise-grade security logs tracking all configuration edits, build events, and system logins.</p>
        </div>

        {/* Filter Section Card */}
        <div className="rounded-xl border border-white/5 bg-[#0e1017]/70 p-5 mb-8 backdrop-blur-xl">
          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
              <Filter className="h-3.5 w-3.5" />
              Filter Logs
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filter: User */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">User ID</label>
                <input
                  type="text"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  placeholder="Mongo ObjectId"
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs placeholder-gray-600 text-gray-300 focus:border-purple-500/80 focus:outline-none"
                />
              </div>

              {/* Filter: Project */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Project ID</label>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/80 focus:outline-none cursor-pointer"
                >
                  <option value="">All Projects</option>
                  {projectsList.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter: Action */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Action Event</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/80 focus:outline-none cursor-pointer"
                >
                  <option value="">All Actions</option>
                  {actionsList.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Filter: Start Date */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/80 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Filter: End Date */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/80 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-[11px] font-semibold text-gray-400 hover:text-white transition duration-200 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 rounded-lg text-[11px] font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* TIMELINE LIST */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Querying secure event log...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/5">
            <p className="text-xs text-gray-500 italic">No audit trail logs match your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto pb-24">
            
            {/* Timeline wrapper */}
            <div className="relative border-l border-white/5 ml-3 pl-8 space-y-6">
              
              {logs.map((log) => {
                const isExpanded = expandedLogId === log._id;
                
                return (
                  <div key={log._id} className="relative group animate-fadeIn">
                    
                    {/* Circle Indicator on timeline */}
                    <div className="absolute -left-[41px] top-1.5 h-6 w-6 rounded-full bg-[#07080d] border border-white/10 flex items-center justify-center text-purple-500 group-hover:border-purple-500/50 group-hover:text-purple-400 transition-all duration-300">
                      <Clock className="h-3 w-3" />
                    </div>

                    {/* Log Card Box */}
                    <div className="rounded-xl border border-white/5 bg-[#0e1017]/40 hover:bg-[#12141c]/50 p-4 transition-all duration-200 backdrop-blur-xl">
                      
                      {/* Card Content Row */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        
                        {/* Event Title / User Info */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-300 font-semibold">{log.resourceType}</span>
                            {log.resourceId && (
                              <span className="text-[10px] font-mono text-gray-500">ID: {log.resourceId}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                            <UserIcon className="h-3 w-3 text-purple-400" />
                            <span className="font-semibold text-gray-300">{log.userId?.name || "System User"}</span>
                            <span className="text-gray-600 font-light">•</span>
                            <span className="text-gray-500 text-[10px]">{log.userId?.email || "system"}</span>
                          </div>
                        </div>

                        {/* Timestamp / Collapse Trigger */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                          <span className="text-[10px] font-mono text-gray-500 block">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <button
                            onClick={() => toggleExpandLog(log._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold bg-[#12141c] hover:bg-white/5 text-gray-400 hover:text-white border border-white/5 rounded transition cursor-pointer"
                          >
                            {isExpanded ? "Hide Details" : "Inspect Metadata"}
                          </button>
                        </div>

                      </div>

                      {/* Expanded Meta Info (JSON Viewer) */}
                      {isExpanded && (
                        <div className="mt-4 border-t border-white/5 pt-4 space-y-3 animate-fadeIn">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 block mb-1">Payload Metadata</span>
                            <pre className="text-[10px] font-mono text-gray-400 bg-white/5 rounded-lg border border-white/5 p-3 overflow-x-auto max-w-full">
                              {JSON.stringify(log.metadata || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="flex justify-between items-center pt-6 border-t border-white/5 text-xs text-gray-500">
                <span>Page {currentPage} of {pages} ({total} logs total)</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded bg-[#12141c] hover:bg-white/5 border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))}
                    disabled={currentPage === pages}
                    className="px-3 py-1.5 rounded bg-[#12141c] hover:bg-white/5 border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default AuditLogsTimeline;
