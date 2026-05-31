import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b0c10] text-gray-200">
        <div className="relative flex items-center justify-center">
          {/* Animated Glow Rings */}
          <div className="absolute h-16 w-16 animate-ping rounded-full border border-purple-500/30 opacity-75"></div>
          <div className="absolute h-20 w-20 animate-pulse rounded-full border border-indigo-500/20"></div>
          {/* Main Spinner */}
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
        </div>
        <p className="mt-6 text-xs font-semibold tracking-widest text-purple-400 uppercase animate-pulse">
          Loading Application...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
