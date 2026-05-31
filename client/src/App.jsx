import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Projects from "./pages/projects/Projects";
import CreateProject from "./pages/projects/CreateProject";
import EditProject from "./pages/projects/EditProject";
import TemplatesPage from "./pages/templates/TemplatesPage";
import OrganizationDashboard from "./pages/organization/OrganizationDashboard";
import AuditLogsTimeline from "./pages/audit/AuditLogsTimeline";
import Domains from "./pages/domains/Domains";
import LogsPage from "./pages/logs/LogsPage";
import PipelinePage from "./pages/pipeline/PipelinePage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ImagesPage from "./pages/images/ImagesPage";
import EnvironmentPage from "./pages/settings/EnvironmentPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ToastNotification from "./components/notifications/ToastNotification";
import ReconnectBanner from "./components/common/ReconnectBanner";

// Cloud Native Suite imports
import KubernetesVisualizerPage from "./pages/cloudnative/KubernetesVisualizerPage";
import KubernetesDashboard from "./pages/cloudnative/KubernetesDashboard";
import MultiCloudDashboard from "./pages/cloudnative/MultiCloudDashboard";
import IacDashboard from "./pages/cloudnative/IacDashboard";
import ContainerRegistryDashboard from "./pages/cloudnative/ContainerRegistryDashboard";
import AutoScalingDashboard from "./pages/cloudnative/AutoScalingDashboard";
import DeveloperPortal from "./pages/cloudnative/DeveloperPortal";
import SaaSAdminDashboard from "./pages/cloudnative/SaaSAdminDashboard";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <ReconnectBanner />
      <ToastNotification />
      <Routes>
        {/* Protected Notifications Center */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Main Dashboard: Projects list */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        {/* Protected Template Marketplace Path */}
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Organization Dashboard Path */}
        <Route
          path="/organizations"
          element={
            <ProtectedRoute>
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Audit Logs Timeline Path */}
        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <AuditLogsTimeline />
            </ProtectedRoute>
          }
        />

        {/* Protected DevOps Metrics Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Docker Image Registry Path */}
        <Route
          path="/images"
          element={
            <ProtectedRoute>
              <ImagesPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Environment Settings Path */}
        <Route
          path="/projects/:projectId/env"
          element={
            <ProtectedRoute>
              <EnvironmentPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Project Creation Path */}
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        {/* Protected Project Edit Path */}
        <Route
          path="/projects/edit/:id"
          element={
            <ProtectedRoute>
              <EditProject />
            </ProtectedRoute>
          }
        />

        {/* Protected Domains Manager Path */}
        <Route
          path="/domains"
          element={
            <ProtectedRoute>
              <Domains />
            </ProtectedRoute>
          }
        />

        {/* Protected Deployment Logs Path */}
        <Route
          path="/deployments/:id/logs"
          element={
            <ProtectedRoute>
              <LogsPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Pipeline Visualizer Path */}
        <Route
          path="/deployments/:id/pipeline"
          element={
            <ProtectedRoute>
              <PipelinePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Cloud Native Suite Routes */}
        <Route
          path="/k8s/visualizer"
          element={
            <ProtectedRoute>
              <KubernetesVisualizerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/k8s/manager"
          element={
            <ProtectedRoute>
              <KubernetesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cloud"
          element={
            <ProtectedRoute>
              <MultiCloudDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/iac"
          element={
            <ProtectedRoute>
              <IacDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry"
          element={
            <ProtectedRoute>
              <ContainerRegistryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scaling"
          element={
            <ProtectedRoute>
              <AutoScalingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev"
          element={
            <ProtectedRoute>
              <DeveloperPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saas"
          element={
            <ProtectedRoute>
              <SaaSAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Catch-all redirect to Projects Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
