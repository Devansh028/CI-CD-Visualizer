import React from "react";
import { HardDrive, Play, Trash2, Eye, GitBranch, Calendar } from "lucide-react";

const ImageTable = ({ images, onInspect, onRedeploy, onDelete }) => {
  const formatSize = (bytes) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusBadge = (status) => {
    const config = {
      active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      archived: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
      deleted: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config[status] || config.active}`}>
        {status}
      </span>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/5 p-12 text-center flex flex-col items-center justify-center">
        <HardDrive className="h-8 w-8 text-gray-600 mb-3 animate-pulse" />
        <h3 className="text-xs font-bold text-gray-300">No Docker images found</h3>
        <p className="text-[11px] text-gray-500 max-w-xs mt-1">
          Images are generated automatically during successful pipeline runs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <th className="py-3 px-4">Image Name / Repository</th>
            <th className="py-3 px-4">Associated Project</th>
            <th className="py-3 px-4">Tag / Version</th>
            <th className="py-3 px-4 text-right">Size</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Generated On</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-xs text-gray-300">
          {images.map((img) => (
            <tr key={img._id} className="hover:bg-white/2 transition duration-200">
              {/* Image Name / ID */}
              <td className="py-3.5 px-4 font-mono font-bold text-white">
                <div className="flex flex-col">
                  <span>{img.imageName}</span>
                  <span className="text-[10px] text-gray-500 font-light mt-0.5">
                    ID: {img.dockerImageId?.substring(7, 19) || img.imageId?.substring(7, 19)}
                  </span>
                </div>
              </td>

              {/* Project */}
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-1.5 font-medium text-white">
                  <span>{img.projectId?.name || img.projectName || "Unknown Project"}</span>
                  {img.projectId?.branch && (
                    <>
                      <span className="text-gray-600">/</span>
                      <span className="text-purple-400 font-mono flex items-center gap-0.5">
                        <GitBranch className="h-3 w-3 shrink-0" />
                        {img.projectId.branch}
                      </span>
                    </>
                  )}
                </div>
              </td>

              {/* Tag / Version */}
              <td className="py-3.5 px-4">
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                  {img.tag}
                </span>
              </td>

              {/* Size */}
              <td className="py-3.5 px-4 text-right font-mono font-bold">
                {formatSize(img.imageSize || img.size)}
              </td>

              {/* Status */}
              <td className="py-3.5 px-4">
                {getStatusBadge(img.status)}
              </td>

              {/* Created At */}
              <td className="py-3.5 px-4 font-medium text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-600" />
                  {formatDate(img.createdAt)}
                </div>
              </td>

              {/* Actions */}
              <td className="py-3.5 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onInspect(img)}
                    className="p-1.5 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-white transition duration-200 cursor-pointer"
                    title="Inspect Metadata"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRedeploy(img)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider transition duration-200 cursor-pointer"
                    title="Redeploy Image"
                  >
                    <Play className="h-3 w-3" />
                    Redeploy
                  </button>
                  <button
                    onClick={() => onDelete(img)}
                    className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition duration-200 cursor-pointer"
                    title="Delete Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ImageTable;
