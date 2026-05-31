import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Centered error layout panel with retry callback actions.
 */
export const ErrorState = ({ 
  title = "An error occurred", 
  message = "We encountered a problem fetching this data.", 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-red-950/15 border border-red-500/20 backdrop-blur-md max-w-md mx-auto my-6">
      <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 mb-4">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-md font-semibold text-gray-200 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-6 leading-relaxed max-w-xs">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700/80 text-gray-200 text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ErrorState;
