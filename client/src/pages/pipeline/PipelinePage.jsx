import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDeploymentStore } from "../../store/deploymentStore";
import PipelineCanvas from "../../components/pipeline/PipelineCanvas";
import PipelineStatusPanel from "../../components/pipeline/PipelineStatusPanel";
import PipelineLegend from "../../components/pipeline/PipelineLegend";
import { Terminal, ArrowLeft, Loader2 } from "lucide-react";

const PipelinePage = () => {
  const { id } = useParams();
  const {
    pipelineStages,
    currentDeployment,
    fetchDeploymentDetails,
    fetchPipelineStatus,
    subscribeToDeployment,
    unsubscribeFromDeployment,
    isLoading,
    error,
  } = useDeploymentStore();

  useEffect(() => {
    // 1. Fetch historical details, timings & stages
    fetchDeploymentDetails(id);
    fetchPipelineStatus(id);

    // 2. Subscribe to real-time socket updates
    subscribeToDeployment(id);

    // 3. Cleanup on unmount
    return () => {
      unsubscribeFromDeployment(id);
    };
  }, [id, fetchDeploymentDetails, fetchPipelineStatus, subscribeToDeployment, unsubscribeFromDeployment]);

  return (
    <div className="min-h-screen bg-[#07080d] text-white flex flex-col">
      {/* Header / Navbar */}
      <header className="border-b border-white/5 bg-[#0e1017]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition duration-200">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold">Back to Projects</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-xs font-bold text-gray-300">Pipeline Visualizer</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Raw Terminal Logs Button */}
            <Link
              to={`/deployments/${id}/logs`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-xs font-semibold transition duration-200"
            >
              <Terminal className="h-3.5 w-3.5" />
              Raw Console Logs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400 shrink-0">
            {error}
          </div>
        )}

        {/* Loading details state */}
        {isLoading && !currentDeployment ? (
          <div className="flex-grow flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="text-sm font-medium">Loading Pipeline Visualizer...</span>
            </div>
          </div>
        ) : !currentDeployment ? (
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-12 text-center flex-grow flex flex-col items-center justify-center">
            <p className="text-sm text-gray-400">Deployment record not found or access denied.</p>
            <Link to="/" className="mt-4 inline-flex text-xs text-purple-400 font-semibold hover:underline">
              Return to dashboard
            </Link>
          </div>
        ) : (
          <div className="flex-grow flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Left Column: Visual Canvas Board */}
            <div className="flex-grow relative flex flex-col min-h-[400px]">
              <PipelineCanvas stages={pipelineStages} />
              <PipelineLegend />
            </div>

            {/* Right Column: Deployment Side Details Card */}
            <PipelineStatusPanel deployment={currentDeployment} />
          </div>
        )}
      </main>
    </div>
  );
};

export default PipelinePage;
