// File: src/services/fishService.js
import api from "./api";

/**
 * Get all active fish types
 */
export const getFishTypes = async () => {
  const response = await api.get("/fish-types");
  return response.data;
};
