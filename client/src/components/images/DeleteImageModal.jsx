import React from "react";
import { X, Trash2, AlertOctagon } from "lucide-react";

const DeleteImageModal = ({ isOpen, onClose, image, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-[#0e1017] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-rose-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Delete Docker Image
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-300 font-light leading-relaxed">
            You are about to delete the following Docker image from both the database metadata log and the local Docker host registry:
          </p>

          <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 font-mono text-xs">
            <div className="font-bold text-white mb-0.5">{image?.imageName}</div>
            <div className="text-rose-400 font-semibold">Tag: {image?.tag}</div>
          </div>

          <div className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-3 text-[11px] text-rose-400 leading-normal flex gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <strong>Warning:</strong> If this image is currently running in a container, deleting the image might fail or cause side effects. This action cannot be undone.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-[#08090d]/50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-900/20 active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteImageModal;
