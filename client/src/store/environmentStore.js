import { create } from "zustand";
import * as environmentApi from "../api/environmentApi";

export const useEnvironmentStore = create((set, get) => ({
  variables: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  /**
   * Fetches environment variables.
   */
  fetchVariables: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await environmentApi.getEnvVars(projectId);
      set({ variables: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load environment variables.",
      });
    }
  },

  /**
   * Creates a new environment variable.
   */
  createVariable: async (projectId, envData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await environmentApi.addEnvVar(projectId, envData);
      set((state) => ({
        variables: [...state.variables, data],
        isLoading: false,
      }));
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create environment variable.";
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  /**
   * Updates an existing environment variable.
   */
  editVariable: async (projectId, envId, envData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await environmentApi.updateEnvVar(projectId, envId, envData);
      set((state) => ({
        variables: state.variables.map((v) => (v._id === envId ? data : v)),
        isLoading: false,
      }));
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update environment variable.";
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  /**
   * Deletes an environment variable.
   */
  removeVariable: async (projectId, envId) => {
    try {
      set({ isLoading: true, error: null });
      await environmentApi.deleteEnvVar(projectId, envId);
      set((state) => ({
        variables: state.variables.filter((v) => v._id !== envId),
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to delete environment variable.",
      });
      throw err;
    }
  },
}));
