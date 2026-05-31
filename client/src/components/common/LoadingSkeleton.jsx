import React from "react";

/**
 * Shimmering skeleton loader for card elements, grids, and list rows.
 */
export const LoadingSkeleton = ({ type = "card", count = 1 }) => {
  const shimmerClass = "relative overflow-hidden bg-gray-800/40 rounded-lg border border-gray-700/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-gray-700/20 before:to-transparent";

  const renderSkeleton = () => {
    switch (type) {
      case "stat":
        return (
          <div className={`${shimmerClass} p-6 h-28 flex flex-col justify-between`}>
            <div className="h-3 w-1/3 bg-gray-700/50 rounded"></div>
            <div className="h-6 w-2/3 bg-gray-700/50 rounded"></div>
            <div className="h-2.5 w-1/2 bg-gray-700/50 rounded"></div>
          </div>
        );
      case "row":
        return (
          <div className={`${shimmerClass} p-4 h-16 flex items-center justify-between`}>
            <div className="flex items-center gap-3 w-1/2">
              <div className="h-8 w-8 bg-gray-700/50 rounded-full shrink-0"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-3 w-1/3 bg-gray-700/50 rounded"></div>
                <div className="h-2 w-1/2 bg-gray-700/30 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-700/50 rounded"></div>
          </div>
        );
      case "chart":
        return (
          <div className={`${shimmerClass} p-6 h-72 flex flex-col justify-between`}>
            <div className="h-4 w-1/4 bg-gray-700/50 rounded"></div>
            <div className="flex items-end gap-3 h-44 w-full px-2">
              <div className="w-full bg-gray-700/30 rounded-t h-1/3"></div>
              <div className="w-full bg-gray-700/30 rounded-t h-1/2"></div>
              <div className="w-full bg-gray-700/30 rounded-t h-2/3"></div>
              <div className="w-full bg-gray-700/30 rounded-t h-1/4"></div>
              <div className="w-full bg-gray-700/30 rounded-t h-5/6"></div>
              <div className="w-full bg-gray-700/30 rounded-t h-3/4"></div>
            </div>
            <div className="h-3 w-full bg-gray-700/20 rounded"></div>
          </div>
        );
      case "card":
      default:
        return (
          <div className={`${shimmerClass} p-6 h-48 flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-1/3 bg-gray-700/50 rounded"></div>
                <div className="h-5 w-16 bg-gray-700/50 rounded-full"></div>
              </div>
              <div className="h-2.5 w-full bg-gray-700/40 rounded mb-2"></div>
              <div className="h-2.5 w-5/6 bg-gray-700/40 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-700/50 rounded"></div>
              <div className="h-8 w-24 bg-gray-700/30 rounded"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="grid gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
