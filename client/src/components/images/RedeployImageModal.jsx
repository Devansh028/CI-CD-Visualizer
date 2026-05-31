import React from "react";
import { X, Play, AlertTriangle } from "lucide-react";

const RedeployImageModal = ({ isOpen, onClose, image, onConfirm, isRedeploying }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#0e1017] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Confirm Redeployment
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isRedeploying}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-300 font-light leading-relaxed">
            You are about to launch a new container instance using the Docker image:
          </p>
          
          <div className="p-3.5 rounded-xl border border-purple-500/10 bg-purple-500/5 font-mono text-xs">
            <div className="font-bold text-white mb-0.5">{image?.imageName}</div>
            <div className="text-purple-400 font-semibold">Tag: {image?.tag}</div>
          </div>

          <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 text-[11px] text-amber-400 leading-normal flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <strong>Action required:</strong> This will temporarily take down the active running container instance for this project to start the new container using the selected image tag. No project build will occur.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-[#08090d]/50">
          <button
            onClick={onClose}
            disabled={isRedeploying}
            className="rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRedeploying}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/20 hover:brightness-110 active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {isRedeploying ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Processing...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Redeploy Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedeployImageModal;
