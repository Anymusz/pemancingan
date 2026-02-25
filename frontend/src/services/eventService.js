// File: src/services/eventService.js
import api from "./api";

/**
 * Get all published events
 * @returns {Promise} Response dengan list events
 */
export const getEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};

/**
 * Get latest events (untuk landing page)
 * Note: Filtering/slicing dilakukan di component, bukan di service
 */
export const getLatestEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};
