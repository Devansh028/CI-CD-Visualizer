import { create } from "zustand";
import * as domainApi from "../api/domainApi";

export const useDomainStore = create((set) => ({
  domains: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchDomains: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await domainApi.getDomains();
      set({ domains: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load domains.",
      });
    }
  },

  createDomain: async (domainData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await domainApi.createDomain(domainData);
      set((state) => ({
        domains: [...state.domains, data.domain],
        isLoading: false,
      }));
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to create domain mapping.";
      set({
        isLoading: false,
        error: errMsg,
      });
      throw err;
    }
  },

  deleteDomain: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await domainApi.deleteDomain(id);
      set((state) => ({
        domains: state.domains.filter((d) => d._id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to delete domain mapping.",
      });
      throw err;
    }
  },
}));
