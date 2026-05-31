import { create } from "zustand";
import * as deploymentApi from "../api/deploymentApi";
import socketService from "../services/socket";

export const useDeploymentStore = create((set, get) => ({
  logs: [],
  currentDeployment: null,
  projectDeployments: [],
  pipelineStages: [],
  isLoading: false,
  error: null,
  socketConnected: false,

  clearError: () => set({ error: null }),
  clearLogs: () => set({ logs: [] }),

  /**
   * Fetch detailed pipeline stages timings and states.
   */
  fetchPipelineStatus: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const data = await deploymentApi.getPipelineStatus(id);
      set({
        pipelineStages: data.stages || [],
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load pipeline stages.",
      });
      throw err;
    }
  },

  /**
   * Fetch historical logs for a deployment to restore state.
   */
  fetchLogs: async (deploymentId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await deploymentApi.getDeploymentLogs(deploymentId);
      set({ logs: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load historical logs.",
      });
    }
  },

  /**
   * Fetch deployment details (status, configurations, progress)
   */
  fetchDeploymentDetails: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const data = await deploymentApi.getDeploymentDetails(id);
      
      // If we loaded the details, sync the logs array from the details payload
      set({
        currentDeployment: data,
        logs: data.logs || [],
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to retrieve deployment details.",
      });
      throw err;
    }
  },

  /**
   * Fetch list of project deployments.
   */
  fetchProjectDeployments: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await deploymentApi.getProjectDeployments(projectId);
      set({ projectDeployments: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load project deployments.",
      });
    }
  },

  /**
   * Trigger a new manual deployment.
   */
  triggerDeployment: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await deploymentApi.triggerDeployment(projectId);
      set({ isLoading: false });
      return data; // contains deploymentId
    } catch (err) {
      const errorObj = {
        message: err.response?.data?.error || "Failed to trigger deployment.",
        details: err.response?.data?.details || err.message,
        stack: err.response?.data?.stack || null
      };
      set({
        isLoading: false,
        error: errorObj,
      });
      throw err;
    }
  },

  /**
   * Set up real-time WebSocket listeners for a specific deployment.
   */
  subscribeToDeployment: (deploymentId) => {
    // Establish connection and join deployment room
    socketService.connect();
    socketService.joinDeployment(deploymentId);
    set({ socketConnected: true });

    // Live logs stream handler
    socketService.on("deployment:log", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => ({
          logs: [...state.logs, data],
        }));
      }
    });

    // Stage updates handler
    socketService.on("deployment:stage-update", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => {
          const nextStages = state.pipelineStages.map((stage) => {
            if (stage.name === data.currentStage) {
              return {
                ...stage,
                status: "running",
                startedAt: stage.startedAt || new Date(),
                completedAt: null,
              };
            }
            
            const currentIndex = state.pipelineStages.findIndex(s => s.name === data.currentStage);
            const stageIndex = state.pipelineStages.findIndex(s => s.name === stage.name);
            
            if (stageIndex < currentIndex && stage.status !== "success") {
              const now = new Date();
              const start = stage.startedAt ? new Date(stage.startedAt) : now;
              return {
                ...stage,
                status: "success",
                completedAt: stage.completedAt || now,
                duration: Math.round((now - start) / 1000)
              };
            }

            return stage;
          });

          return {
            currentDeployment: state.currentDeployment 
              ? { 
                  ...state.currentDeployment, 
                  currentStage: data.currentStage, 
                  status: data.status || state.currentDeployment.status 
                }
              : null,
            pipelineStages: nextStages
          };
        });
      }
    });

    // Pipeline started handler
    socketService.on("deployment:started", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => {
          const nextStages = state.pipelineStages.map((stage, idx) => {
            if (idx === 0) {
              return {
                ...stage,
                status: "running",
                startedAt: data.startedAt,
                completedAt: null,
                duration: null
              };
            }
            return {
              ...stage,
              status: "pending",
              startedAt: null,
              completedAt: null,
              duration: null
            };
          });

          return {
            currentDeployment: state.currentDeployment
              ? { ...state.currentDeployment, status: "running", startedAt: data.startedAt }
              : null,
            pipelineStages: nextStages
          };
        });
      }
    });

    // Pipeline success handler
    socketService.on("deployment:success", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => {
          const nextStages = state.pipelineStages.map((stage) => {
            const now = new Date();
            const start = stage.startedAt ? new Date(stage.startedAt) : now;
            return {
              ...stage,
              status: "success",
              completedAt: stage.completedAt || now,
              duration: stage.duration !== null ? stage.duration : Math.round((now - start) / 1000)
            };
          });

          return {
            currentDeployment: state.currentDeployment
              ? { 
                  ...state.currentDeployment, 
                  status: "success", 
                  currentStage: "success", 
                  completedAt: data.completedAt, 
                  duration: data.duration,
                  containerPort: data.containerPort 
                }
              : null,
            pipelineStages: nextStages
          };
        });
      }
    });

    // Pipeline failure handler
    socketService.on("deployment:failed", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => {
          const activeStage = data.currentStage || state.currentDeployment?.currentStage;
          const activeIndex = state.pipelineStages.findIndex(s => s.name === activeStage);
          
          const nextStages = state.pipelineStages.map((stage, idx) => {
            if (idx < activeIndex) {
              return { ...stage, status: "success" };
            } else if (idx === activeIndex) {
              const start = stage.startedAt ? new Date(stage.startedAt) : new Date();
              const end = new Date();
              return {
                ...stage,
                status: "failed",
                completedAt: end,
                duration: Math.round((end - start) / 1000)
              };
            } else {
              return { ...stage, status: "skipped", startedAt: null, completedAt: null, duration: null };
            }
          });

          return {
            currentDeployment: state.currentDeployment
              ? { 
                  ...state.currentDeployment, 
                  status: "failed", 
                  currentStage: activeStage, 
                  completedAt: data.completedAt, 
                  duration: data.duration,
                  failureReason: data.failureReason || ""
                }
              : null,
            pipelineStages: nextStages
          };
        });
      }
    });

    // Health status updates handler
    socketService.on("deployment:health-update", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => {
          const nextStages = state.pipelineStages.map((stage) => {
            if (stage.name === "health-check") {
              const start = stage.startedAt ? new Date(stage.startedAt) : new Date();
              const end = new Date();
              return {
                ...stage,
                status: "success",
                completedAt: end,
                duration: Math.round((end - start) / 1000)
              };
            }
            return stage;
          });

          return {
            currentDeployment: state.currentDeployment
              ? { ...state.currentDeployment, containerStatus: "healthy" }
              : null,
            pipelineStages: nextStages
          };
        });
      }
    });

    // Domain ready updates handler
    socketService.on("deployment:domain-ready", (data) => {
      if (data.deploymentId === deploymentId) {
        set((state) => {
          const nextStages = state.pipelineStages.map((stage) => {
            if (stage.name === "reverse-proxy-setup") {
              const start = stage.startedAt ? new Date(stage.startedAt) : new Date();
              const end = new Date();
              return {
                ...stage,
                status: "success",
                completedAt: end,
                duration: Math.round((end - start) / 1000)
              };
            }
            return stage;
          });

          return {
            currentDeployment: state.currentDeployment
              ? { ...state.currentDeployment, domainUrl: data.domain }
              : null,
            pipelineStages: nextStages
          };
        });
      }
    });
  },

  /**
   * Clean up and unsubscribe from deployment WebSocket events.
   */
  unsubscribeFromDeployment: (deploymentId) => {
    socketService.leaveDeployment(deploymentId);
    socketService.off("deployment:log");
    socketService.off("deployment:stage-update");
    socketService.off("deployment:started");
    socketService.off("deployment:success");
    socketService.off("deployment:failed");
    socketService.off("deployment:health-update");
    socketService.off("deployment:domain-ready");
    set({ socketConnected: false });
  }
}));
