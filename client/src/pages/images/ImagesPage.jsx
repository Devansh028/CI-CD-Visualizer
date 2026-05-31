import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useImageStore } from "../../store/imageStore";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import {
  Terminal,
  LogOut,
  Layers,
  Globe,
  HardDrive,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import NotificationBell from "../../components/notifications/NotificationBell";
import AppLayout from "../../components/layout/AppLayout";

// Components
import ImageTable from "../../components/images/ImageTable";
import ImageDetailsModal from "../../components/images/ImageDetailsModal";
import RedeployImageModal from "../../components/images/RedeployImageModal";
import DeleteImageModal from "../../components/images/DeleteImageModal";

const ImagesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  
  const {
    images,
    total,
    page,
    pages,
    selectedImage,
    selectedImageDetails,
    isLoading,
    isRedeploying,
    error,
    fetchImages,
    fetchInspectImage,
    triggerRedeploy,
    triggerDelete,
    setSelectedImage,
    clearError,
  } = useImageStore();

  // State
  const [filterProjectId, setFilterProjectId] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [redeployModalOpen, setRedeployModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
    clearError();
  }, [fetchProjects, clearError]);

  useEffect(() => {
    fetchImages(activePage, 10, filterProjectId || null);
  }, [fetchImages, activePage, filterProjectId]);

  const handleFilterChange = (e) => {
    setFilterProjectId(e.target.value);
    setActivePage(1); // Reset page on filter
  };

  const handleInspectOpen = (img) => {
    setSelectedImage(img);
    setInspectModalOpen(true);
    fetchInspectImage(img._id);
  };

  const handleRedeployOpen = (img) => {
    setSelectedImage(img);
    setRedeployModalOpen(true);
  };

  const handleRedeployConfirm = async () => {
    if (!selectedImage) return;
    try {
      const response = await triggerRedeploy(selectedImage._id);
      setRedeployModalOpen(false);
      if (response && response.deploymentId) {
        navigate(`/deployments/${response.deploymentId}/pipeline`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOpen = (img) => {
    setSelectedImage(img);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedImage) return;
    try {
      await triggerDelete(selectedImage._id);
      setDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarInfo = {
    title: "Registry Info",
    description: "Docker Image registry stores your project build snapshots. Skips git clones and dependency compilation by redeploying existing versions instantly.",
    status: "Available",
    statusColor: "text-purple-500",
  };

  return (
    <>
      <AppLayout sidebarInfo={sidebarInfo}>
      {/* Primary view */}
      <section className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Docker Image Registry
              </h1>
              <p className="text-xs text-gray-400 font-light mt-1">
                View built container snapshots, inspect metadata, and deploy older versions.
              </p>
            </div>

            {/* Filter selection */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-400" />
              <select
                value={filterProjectId}
                onChange={handleFilterChange}
                className="rounded-lg border border-white/5 bg-[#12141c] px-3 py-1.5 text-xs text-white focus:border-purple-500/50 focus:outline-none transition"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          {/* Table list */}
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl">
            {isLoading && images.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-500 animate-pulse">
                Fetching registry logs...
              </div>
            ) : (
              <>
                <ImageTable
                  images={images}
                  onInspect={handleInspectOpen}
                  onRedeploy={handleRedeployOpen}
                  onDelete={handleDeleteOpen}
                />

                {/* Pagination Controls */}
                {pages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
                    <span className="text-[11px] text-gray-500">
                      Showing page {page} of {pages} ({total} total images)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded bg-white/5 border border-white/5 hover:text-white transition disabled:opacity-50 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActivePage((prev) => Math.min(pages, prev + 1))}
                        disabled={page === pages}
                        className="p-1.5 rounded bg-white/5 border border-white/5 hover:text-white transition disabled:opacity-50 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
    </AppLayout>

      {/* Details Inspect Modal */}
      <ImageDetailsModal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        image={selectedImage}
        details={selectedImageDetails}
        isLoading={isLoading}
      />

      {/* Redeploy Modal */}
      <RedeployImageModal
        isOpen={redeployModalOpen}
        onClose={() => setRedeployModalOpen(false)}
        image={selectedImage}
        onConfirm={handleRedeployConfirm}
        isRedeploying={isRedeploying}
      />

      {/* Delete Modal */}
      <DeleteImageModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        image={selectedImage}
        onConfirm={handleDeleteConfirm}
        isDeleting={isLoading}
      />
    </>
  );
};

export default ImagesPage;
