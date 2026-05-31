import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import { useDeploymentStore } from "../../store/deploymentStore";
import {
  Plus,
  FolderOpen,
  AlertTriangle
} from "lucide-react";
import NotificationBell from "../../components/notifications/NotificationBell";
import AppLayout from "../../components/layout/AppLayout";
import ProjectCard from "./ProjectCard";

const Projects = () => {
  const { projects, fetchProjects, deleteProject, isLoading, error } = useProjectStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { triggerDeployment, isLoading: isDeploying, error: deploymentError, clearError: clearDeploymentError } = useDeploymentStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeploy = async (projectId) => {
    try {
      const response = await triggerDeployment(projectId);
      if (response && response.deploymentId) {
        navigate(`/deployments/${response.deploymentId}/pipeline`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will permanently delete the project settings and active environment variables.`)) {
      try {
        await deleteProject(id);
      } catch (err) {
        console.error(err);
      }
    }
  };



  const sidebarInfo = {
    title: "Visualizer Info",
    description: "Module 2 handles secure setup and configuration of user code repository branches, frameworks, deploy ports, and key-value environments.",
    status: "Verified",
    statusColor: "text-purple-500",
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      {/* Content Area */}
      <section className="w-full">
          {/* Header Action Row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Active Projects</h1>
              <p className="text-xs text-gray-400 font-light mt-1">Manage, edit, and orchestrate repository build workflows</p>
            </div>
            
            <Link
              to="/projects/new"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:brightness-110 active:scale-[0.99] transition duration-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400 mb-6">
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl border border-white/5 bg-[#0e1017]/25 p-6 animate-pulse"></div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-12 text-center backdrop-blur-xl flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-400 mb-4 animate-bounce">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-gray-200">No projects found</h3>
              <p className="text-xs text-gray-500 font-light mt-2 max-w-sm">
                To initiate container-daemon deployments and pipeline logs, you must first define a project repository.
              </p>
              <Link
                to="/projects/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition duration-200"
              >
                Create your first project
              </Link>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  handleDeploy={handleDeploy}
                  handleDelete={handleDelete}
                  isDeploying={isDeploying}
                />
              ))}
            </div>
          )}
        </section>

        {/* Glassmorphic Pre-flight Trigger Error Modal */}
        {deploymentError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e1017]/85 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Decorative gradient overlay */}
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-rose-500/10 blur-[40px] pointer-events-none"></div>
              
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Deployment Pipeline Blocked</h2>
                  <p className="text-[11px] text-gray-400 font-light mt-0.5 font-mono">The pre-flight checks or deployment process failed</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow overflow-y-auto space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-white/5">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Error Category</span>
                  <div className="text-sm font-semibold text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-2.5">
                    {deploymentError.message || "Unknown Trigger Error"}
                  </div>
                </div>

                {deploymentError.details && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Detailed Reason</span>
                    <div className="text-xs text-gray-300 font-light leading-relaxed bg-[#06070a] border border-white/5 rounded-lg px-3 py-2.5 whitespace-pre-wrap font-mono">
                      {deploymentError.details}
                    </div>
                  </div>
                )}

                {deploymentError.stack && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono font-mono">Stack Trace (Development Mode)</span>
                    <div className="bg-[#030406] border border-white/5 rounded-lg p-3 max-h-48 overflow-auto font-mono text-[10px] text-gray-500 leading-normal scrollbar-thin">
                      <pre className="whitespace-pre-wrap">{deploymentError.stack}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={clearDeploymentError}
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:brightness-110 active:scale-[0.99] transition duration-200 cursor-pointer"
                >
                  Dismiss Error
                </button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
  );
};

export default Projects;
