import { create } from "zustand";
import API from "../api/axios";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Reset error state
  clearError: () => set({ error: null }),

  // Verify token and load profile on startup
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await API.get("/auth/profile");
      set({
        user: res.data,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.response?.data?.message || "Session expired",
      });
    }
  },

  // User Login Action
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.post("/auth/login", { email, password });
      
      const { token, ...userData } = res.data;
      localStorage.setItem("token", token);
      
      set({
        user: userData,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Authentication failed",
      });
      throw err;
    }
  },

  // User Registration Action
  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.post("/auth/register", { name, email, password });
      
      const { token, ...userData } = res.data;
      localStorage.setItem("token", token);
      
      set({
        user: userData,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Registration failed",
      });
      throw err;
    }
  },

  // Logout Action
  logout: () => {
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
