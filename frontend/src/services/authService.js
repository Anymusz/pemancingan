// File: src/services/authService.js
import api from "./api";
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  isAuthenticated,
} from "@/utils/tokenManager";

export const register = async (data) => {
  const response = await api.post("/register", data);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post("/login", credentials);

  if (response.data.success && response.data.data.token) {
    setToken(response.data.data.token);
    
    try {
      // Fetch full profile via /me to ensure created_at and updated_at are retrieved
      const meResponse = await api.get("/me");
      if (meResponse.data.success) {
        setUser(meResponse.data.data);
      } else {
        setUser(response.data.data.user);
      }
    } catch {
      setUser(response.data.data.user);
    }
  }

  return response.data;
};

export const logout = async () => {
  try {
    const response = await api.post("/logout");
    removeToken();
    removeUser();
    return response.data;
  } catch (error) {
    removeToken();
    removeUser();
    throw error;
  }
};

export const getMe = async () => {
  const response = await api.get("/me");
  return response.data;
};

// Re-export token helpers
export {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  isAuthenticated,
};

export const forgotPassword = async (email) => {
  const response = await api.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post("/reset-password", data);
  return response.data;
};

export default {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  isAuthenticated,
};
