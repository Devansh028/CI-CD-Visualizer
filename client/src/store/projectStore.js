import { create } from "zustand";
import * as projectApi from "../api/projectApi";

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Reset error state
  clearError: () => set({ error: null }),

  // Fetch all user's projects
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await projectApi.getProjects();
      set({ projects: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load projects.",
      });
    }
  },

  // Fetch a project by ID
  fetchProjectById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const data = await projectApi.getProjectById(id);
      set({ currentProject: data, isLoading: false });
      return data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load project details.",
      });
      throw err;
    }
  },

  // Create a new project
  createProject: async (projectData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await projectApi.createProject(projectData);
      set((state) => ({
        projects: [data, ...state.projects],
        isLoading: false,
      }));
      return data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to create project.",
      });
      throw err;
    }
  },

  // Update project settings
  updateProject: async (id, projectData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await projectApi.updateProject(id, projectData);
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? data : p)),
        currentProject: state.currentProject?._id === id ? data : state.currentProject,
        isLoading: false,
      }));
      return data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to update project.",
      });
      throw err;
    }
  },

  // Delete a project
  deleteProject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await projectApi.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to delete project.",
      });
      throw err;
    }
  },
}));
