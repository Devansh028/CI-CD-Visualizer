import React from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Standard confirmation dialog popup for destructive actions.
 */
export const ConfirmDialog = ({
  isOpen,
  title = "Are you absolutely sure?",
  message = "This action cannot be undone. Please confirm.",
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  severity = "danger", // danger, warning, info
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const btnColors = {
    danger: "bg-red-600 hover:bg-red-500 border-red-500 text-white focus:ring-red-500",
    warning: "bg-amber-600 hover:bg-amber-500 border-amber-500 text-white focus:ring-amber-500",
    info: "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white focus:ring-purple-500"
  };

  const iconColors = {
    danger: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    info: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-2xl p-6">
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/80 transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex gap-4">
          {/* Icon Badge */}
          <div className={`p-3 rounded-full border shrink-0 h-fit ${iconColors[severity]}`}>
            <AlertTriangle size={22} />
          </div>

          {/* Details */}
          <div>
            <h3 className="text-md font-bold text-gray-200 mb-2">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">{message}</p>
            
            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-850 hover:bg-gray-800 text-gray-300 text-xs font-semibold tracking-wide transition-all active:scale-95"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md ${btnColors[severity]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfirmDialog;
