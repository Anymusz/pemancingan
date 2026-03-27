import api from "./api";

const rentalService = {
  // ==================== OWNER ====================

  getRentalItems: async (params = {}) => {
    const response = await api.get("/owner/rental-items", { params });
    return response.data;
  },

  createRentalItem: async (formData) => {
    const response = await api.post("/owner/rental-items", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  updateRentalItem: async (id, formData) => {
    formData.append("_method", "PUT");
    const response = await api.post(`/owner/rental-items/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  deleteRentalItem: async (id) => {
    const response = await api.delete(`/owner/rental-items/${id}`);
    return response.data;
  },

  toggleRentalActive: async (id) => {
    const response = await api.patch(`/owner/rental-items/${id}/toggle-active`);
    return response.data;
  },

  // ==================== EMPLOYEE ====================

  getActiveRentalItems: async () => {
    const response = await api.get("/employee/rental-items");
    return response.data;
  },

  employeeToggleRentalActive: async (id) => {
    const response = await api.patch(
      `/employee/rental-items/${id}/toggle-active`,
    );
    return response.data;
  },
};

export default rentalService;
