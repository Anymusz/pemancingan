// src/services/api.js
import axios from "axios";
import { getToken, removeToken } from "@/utils/tokenManager";

// Create axios instance dengan base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

// ========================================
// Request Interceptor - Attach Token
// ========================================
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ========================================
// Response Interceptor - Handle 401
// ========================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Handle 401 Unauthorized - Token expired/invalid
      if (status === 401) {
        removeToken();

        // Redirect ke login page (avoid infinite loop)
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // Handle error codes lainnya
      switch (status) {
        case 403:
          console.error("Forbidden: You do not have permission");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 422:
          console.error("Validation error:", error.response.data);
          break;
        case 500:
          console.error("Internal server error");
          break;
        default:
          console.error("An error occurred:", error.response.data);
      }
    } else if (error.request) {
      console.error("Network Error: No response from server");
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
