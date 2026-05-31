import { create } from "zustand";
import * as imageApi from "../api/imageApi";

export const useImageStore = create((set, get) => ({
  images: [],
  total: 0,
  page: 1,
  pages: 0,
  
  selectedImage: null,
  selectedImageDetails: null,
  
  isLoading: false,
  isRedeploying: false,
  error: null,

  clearError: () => set({ error: null }),
  setSelectedImage: (image) => set({ selectedImage: image, selectedImageDetails: null }),

  /**
   * Fetches paginated image list.
   */
  fetchImages: async (page = 1, limit = 10, projectId = null) => {
    try {
      set({ isLoading: true, error: null });
      const data = await imageApi.getImages(page, limit, projectId);
      set({
        images: data.images,
        total: data.total,
        page: data.page,
        pages: data.pages,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load Docker images.",
      });
    }
  },

  /**
   * Fetches full JSON metadata inspection details from Docker daemon.
   */
  fetchInspectImage: async (id) => {
    try {
      set({ isLoading: true, error: null, selectedImageDetails: null });
      const details = await imageApi.inspectImage(id);
      set({ selectedImageDetails: details, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to inspect Docker image.",
      });
    }
  },

  /**
   * Triggers redeployment flow for the selected image.
   */
  triggerRedeploy: async (id) => {
    try {
      set({ isRedeploying: true, error: null });
      const data = await imageApi.redeployImage(id);
      set({ isRedeploying: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to initiate redeployment.";
      set({ isRedeploying: false, error: msg });
      throw err;
    }
  },

  /**
   * Triggers deletion of the image.
   */
  triggerDelete: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await imageApi.deleteImage(id);
      
      // Update local state by removing/updating status of deleted item
      const updatedImages = get().images.filter((img) => img._id !== id);
      set({
        images: updatedImages,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to delete Docker image.",
      });
      throw err;
    }
  },
}));
