// File: src/services/fishService.js
import api from "./api";

/**
 * Get all active fish types
 * @returns {Promise} Response dengan list jenis ikan
 */
export const getFishTypes = async () => {
  const response = await api.get("/fish-types");
  return response.data;
};
