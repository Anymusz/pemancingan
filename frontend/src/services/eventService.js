// File: src/services/eventService.js
import api from "./api";

/**
 * Get all published events (paginated)
 * @param {number} page - Page number
 * @param {string|null} category - Category filter ('event' | 'info' | null)
 * @returns {Promise} Response dengan list events
 */
export const getEvents = async (page = 1, category = null) => {
  const params = { page, per_page: 6 };
  if (category) params.category = category;
  const response = await api.get("/events", { params });
  return response.data;
};

/**
 * Get event detail by ID
 * @param {number|string} id - Event ID
 * @returns {Promise} Response dengan event detail
 */
export const getEventDetail = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};
