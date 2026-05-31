import React from "react";
import { Link } from "react-router-dom";
import {
  GitBranch,
  Activity,
  Trash2,
  Edit,
  Terminal,
  Server,
  Layers,
  HardDrive,
  Lock,
  ExternalLink
} from "lucide-react";

const ProjectCard = ({ project, handleDeploy, handleDelete, isDeploying }) => {
  
  const getFrameworkBadge = (framework) => {
    const fw = (framework || "").toLowerCase();
    const styles = {
      node: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      "node.js": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      react: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      vite: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
      next: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
      "next.js": "bg-slate-500/10 text-slate-300 border border-slate-500/20",
      python: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
      django: "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20",
      fastapi: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
      flask: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      java: "bg-red-500/10 text-red-400 border border-red-500/20",
      "spring boot": "bg-green-500/10 text-green-400 border border-green-500/20",
      go: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
      static: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      "static websites": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      express: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20",
      nestjs: "bg-rose-600/10 text-rose-400 border border-rose-600/20",
      mern: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase font-mono ${styles[fw] || "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
        {framework}
      </span>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
      inactive: "bg-gray-500",
      building: "bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]",
      deployed: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]",
      failed: "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="group relative w-full min-w-0 rounded-2xl border border-white/5 bg-[#0a0b10]/60 p-5 shadow-2xl backdrop-blur-xl hover:border-purple-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Dynamic hover backdrop radial highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="min-w-0">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <h3 className="font-bold text-base text-white group-hover:text-purple-400 transition-colors duration-200 truncate pr-2" title={project.name}>
            {project.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 bg-[#07080c]/80 border border-white/5 px-2 py-0.5 rounded-full">
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(project.status)}`}></span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              {project.status}
            </span>
          </div>
        </div>

        {/* Project Description */}
        <p className="text-xs text-gray-400 font-light line-clamp-2 mb-4 leading-relaxed h-8 text-left">
          {project.description || "No description provided for this build configuration."}
        </p>

        {/* Detailed Metadata Grid */}
        <div className="space-y-2 mb-5 font-mono text-[10px] text-gray-400 border-t border-b border-white/5 py-3 text-left">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-500 font-sans">Repo:</span>
            <a 
              href={project.repoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-purple-400 truncate flex items-center gap-0.5 font-medium transition duration-200"
            >
              {project.repoUrl.replace("https://github.com/", "")}
              <ExternalLink className="h-2.5 w-2.5 opacity-50 shrink-0" />
            </a>
            <span className="text-gray-700 font-sans">/</span>
            <span className="text-purple-400 font-semibold bg-purple-950/20 border border-purple-500/10 px-1 rounded truncate">{project.branch}</span>
          </div>

          <div className="flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-500 font-sans">Port:</span>
            <span className="text-indigo-400 font-bold bg-indigo-950/20 border border-indigo-500/10 px-1 rounded">{project.deployPort}</span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Layers className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-500 font-sans">Build Script:</span>
            <span className="text-purple-400 font-semibold truncate max-w-[170px] bg-purple-950/10 px-1 rounded font-mono" title={project.buildCommand || "npm run build"}>
              {project.buildCommand || "npm run build"}
            </span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <HardDrive className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-gray-500 font-sans">Deploy Strategy:</span>
            <span className="text-pink-400 font-semibold truncate max-w-[150px] bg-pink-950/10 px-1 rounded font-mono" title={project.dockerStrategy || "Docker Container"}>
              {project.dockerStrategy || "Docker Container"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions wrapping Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 mt-auto">
        {/* Left Side: Framework Info Badge */}
        <div className="shrink-0">
          {getFrameworkBadge(project.framework)}
        </div>

        {/* Right Side: Responsive Button Actions Layout */}
        <div className="flex flex-wrap items-center gap-2 justify-end grow sm:grow-0 max-w-full">
          {/* Primary Operations Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleDeploy(project._id)}
              disabled={isDeploying || project.status === "building"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 text-[9px] font-extrabold uppercase tracking-wider transition duration-200 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-purple-500/10"
              title="Deploy Now"
            >
              <Activity className="h-3 w-3" />
              Deploy
            </button>

            {project.latestDeploymentId && (
              <Link
                to={`/deployments/${project.latestDeploymentId}/pipeline`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-extrabold uppercase tracking-wider transition duration-200 shadow-sm hover:shadow-indigo-500/10"
                title="View Pipeline Visualizer"
              >
                <Terminal className="h-3 w-3" />
                Visualizer
              </Link>
            )}
          </div>

          {/* Config / CRUD Operations */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to={`/projects/${project._id}/env`}
              className="p-1.5 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition duration-200"
              title="Configure Environment Variables"
            >
              <Lock className="h-3.5 w-3.5" />
            </Link>
            <Link
              to={`/projects/edit/${project._id}`}
              className="p-1.5 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition duration-200"
              title="Edit Settings"
            >
              <Edit className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => handleDelete(project._id, project.name)}
              className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition duration-200 cursor-pointer"
              title="Delete Project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
