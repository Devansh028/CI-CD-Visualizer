import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useEnvironmentStore } from "../../store/environmentStore";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import {
  Terminal,
  LogOut,
  Layers,
  Globe,
  Activity,
  HardDrive,
  Lock,
  ArrowLeft,
  Settings,
} from "lucide-react";
import NotificationBell from "../../components/notifications/NotificationBell";
import AppLayout from "../../components/layout/AppLayout";

// Components
import EnvironmentTable from "../../components/environment/EnvironmentTable";
import EnvironmentForm from "../../components/environment/EnvironmentForm";
import EditEnvironmentModal from "../../components/environment/EditEnvironmentModal";
import DeleteEnvironmentModal from "../../components/environment/DeleteEnvironmentModal";

const EnvironmentPage = () => {
  const { projectId } = useParams();
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  
  const {
    variables,
    fetchVariables,
    createVariable,
    editVariable,
    removeVariable,
    isLoading,
    error,
    clearError,
  } = useEnvironmentStore();

  // Modals state
  const [selectedVar, setSelectedVar] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Find associated project details
  const project = projects.find((p) => p._id === projectId);

  useEffect(() => {
    fetchProjects();
    fetchVariables(projectId);
    clearError();
  }, [fetchProjects, fetchVariables, projectId, clearError]);

  const handleCreate = async (envData) => {
    try {
      await createVariable(projectId, envData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (variable) => {
    setSelectedVar(variable);
    setIsEditOpen(true);
  };

  const handleEditSave = async (payload) => {
    if (!selectedVar) return;
    try {
      await editVariable(projectId, selectedVar._id, payload);
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (variable) => {
    setSelectedVar(variable);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVar) return;
    try {
      await removeVariable(projectId, selectedVar._id);
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarInfo = {
    title: "Secrets Security",
    description: "Variables marked as secrets are encrypted symmetrically using AES-256-CBC and decrypted only during container creation.",
    status: "Enabled",
    statusColor: "text-purple-500",
    statusLabel: "Encryption",
  };

  return (
    <>
      <AppLayout sidebarInfo={sidebarInfo}>
      {/* Primary View */}
      <section className="w-full flex flex-col gap-8">
          {/* Header breadcrumb */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-1.5 rounded-lg border border-white/5 bg-[#12141c] text-gray-400 hover:text-white transition duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Environment Settings
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5">
                  Scope variables and secure secrets for Project:{" "}
                  <span className="text-purple-400 font-bold">{project?.name || "..."}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          {/* Form and List Containers */}
          <div className="grid grid-cols-1 gap-8">
            {/* List */}
            <div className="rounded-2xl border border-white/5 bg-[#0e1017]/50 p-6 shadow-xl backdrop-blur-xl space-y-6">
              <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-2">
                <Settings className="h-4 w-4" /> Variables Configuration
              </h3>
              
              {isLoading && variables.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 animate-pulse">
                  Loading project variables...
                </div>
              ) : (
                <EnvironmentTable
                  variables={variables}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              )}
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 p-6 shadow-xl backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-purple-400 uppercase flex items-center gap-2 pb-2 border-b border-white/5">
                Add Variable
              </h3>
              <EnvironmentForm onSubmit={handleCreate} isLoading={isLoading} />
            </div>
          </div>
        </section>
    </AppLayout>

      {/* Edit Modal */}
      <EditEnvironmentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        variable={selectedVar}
        onSave={handleEditSave}
        isLoading={isLoading}
      />

      {/* Delete Modal */}
      <DeleteEnvironmentModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        variable={selectedVar}
        onConfirm={handleDeleteConfirm}
        isDeleting={isLoading}
      />
    </>
  );
};

export default EnvironmentPage;
