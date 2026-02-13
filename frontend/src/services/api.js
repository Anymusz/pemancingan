// File: src/services/api.js
import axios from "axios";

// Create axios instance dengan base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 detik timeout
});

// Response interceptor untuk global error handling
api.interceptors.response.use(
  (response) => {
    // Jika response sukses, langsung return
    return response;
  },
  (error) => {
    // Global error handling
    if (error.response) {
      // Server response dengan error status (4xx, 5xx)
      console.error("API Error:", error.response.status, error.response.data);

      // Handle specific error codes
      switch (error.response.status) {
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Internal server error");
          break;
        default:
          console.error("An error occurred");
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada response (network error)
      console.error("Network Error: No response from server");
    } else {
      // Error lain saat setup request
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
