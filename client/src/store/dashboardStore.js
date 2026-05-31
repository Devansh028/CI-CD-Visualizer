import { create } from "zustand";
import * as metricsApi from "../api/metricsApi";

const MAX_HISTORY_LENGTH = 15;

export const useDashboardStore = create((set) => ({
  // Core metrics state
  system: null,
  containers: [],
  queues: null,
  deployments: null,
  
  // Historical chart data for resource usages
  cpuHistory: [],
  memHistory: [],
  
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  /**
   * Fetches the entire metrics overview in a single network call on page load.
   */
  fetchOverview: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await metricsApi.getOverviewMetrics();
      
      const timeStr = new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const initialCpu = parseFloat(data.system?.cpuUsage) || 0;
      const initialMem = parseFloat(data.system?.memoryUsage) || 0;

      set({
        system: data.system,
        containers: data.containers,
        queues: data.queues,
        deployments: data.deployments,
        cpuHistory: [{ time: timeStr, value: initialCpu }],
        memHistory: [{ time: timeStr, value: initialMem }],
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load metrics overview.",
      });
    }
  },

  /**
   * Action to process system updates (API or Socket.IO).
   * Appends a new timestamped tick to cpu and memory history logs.
   */
  updateSystem: (systemUpdate) => set((state) => {
    const timeStr = new Date().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const cpu = parseFloat(systemUpdate.cpuUsage) || 0;
    const mem = parseFloat(systemUpdate.memoryUsage) || 0;

    const cpuHistory = [...state.cpuHistory, { time: timeStr, value: cpu }].slice(-MAX_HISTORY_LENGTH);
    const memHistory = [...state.memHistory, { time: timeStr, value: mem }].slice(-MAX_HISTORY_LENGTH);

    return {
      system: systemUpdate,
      cpuHistory,
      memHistory,
    };
  }),

  /**
   * Action to process container list updates.
   */
  updateContainers: (containerUpdate) => set(() => ({
    containers: containerUpdate,
  })),

  /**
   * Action to process BullMQ job count updates.
   */
  updateQueues: (queueUpdate) => set(() => ({
    queues: queueUpdate,
  })),

  /**
   * Action to process user-scoped MongoDB deployment updates.
   */
  updateDeployments: (deploymentUpdate) => set(() => ({
    deployments: deploymentUpdate,
  })),
}));
