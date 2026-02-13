// File: src/services/tierService.js
import api from "./api";

/**
 * Get all member tiers
 * @returns {Promise} Response dengan list tier membership
 */
export const getMemberTiers = async () => {
  const response = await api.get("/member-tiers");
  return response.data;
};
