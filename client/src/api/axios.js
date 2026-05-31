import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Create an instance of Axios
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically attach JWT token to outgoing requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle error responses (such as 401 Unauthorized)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns a 401, we clear local session storage and reset the store
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      try {
        useAuthStore.getState().logout();
      } catch (storeErr) {
        console.error("Auth store logout trigger failed", storeErr);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
