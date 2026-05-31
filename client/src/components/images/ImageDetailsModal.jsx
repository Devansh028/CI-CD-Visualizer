import React from "react";
import { X, Cpu, Calendar, Database, Layers } from "lucide-react";

const ImageDetailsModal = ({ isOpen, onClose, image, details, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/5 bg-[#0e1017] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Docker Image Inspect
            </span>
            <h3 className="text-base font-extrabold text-white mt-1">
              {image?.imageName}:{image?.tag}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-gray-500 animate-pulse">
              Requesting Docker host inspect data...
            </div>
          ) : details ? (
            <>
              {/* Core Parameters Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl border border-white/5 bg-[#08090d]">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Architecture</div>
                  <div className="text-white text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    {details.Architecture} / {details.Os}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-white/5 bg-[#08090d]">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Docker Engine</div>
                  <div className="text-white text-xs font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    v{details.DockerVersion || "N/A"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-white/5 bg-[#08090d]">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Total size</div>
                  <div className="text-white text-xs font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                    <Database className="h-4 w-4 text-emerald-400" />
                    {((details.Size || 0) / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-white/5 bg-[#08090d]">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Created Time</div>
                  <div className="text-white text-xs font-semibold flex items-center gap-1.5 mt-0.5 truncate">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    {new Date(details.Created).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>

              {/* JSON code block */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Daemon Metadata Response
                </div>
                <div className="rounded-xl border border-white/5 bg-[#050608] p-4 overflow-x-auto max-h-[300px] font-mono text-[11px] text-purple-300/80 leading-normal">
                  <pre>{JSON.stringify(details, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-rose-400 font-medium">
              Failed to retrieve Docker daemon inspection metrics.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-[#08090d]/50">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition duration-200 cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageDetailsModal;
