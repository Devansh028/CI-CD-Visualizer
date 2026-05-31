import React from "react";
import { Info } from "lucide-react";

/**
 * Centered placeholder card when listings are empty.
 */
export const EmptyState = ({ 
  title = "No items found", 
  description = "Get started by creating a new resource.", 
  icon: Icon = Info, 
  actionButton 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-gray-900/20 border border-gray-800/80 backdrop-blur-md max-w-lg mx-auto my-6">
      <div className="p-4 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 mb-4 animate-pulse">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionButton && <div className="flex justify-center">{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
