// File: src/services/ownerService.js
import api from "./api";

const ownerService = {
  // ==================== EXISTING METHODS ====================

  getPendingMembers: async () => {
    const response = await api.get("/owner/pending-members");
    return response.data;
  },

  approveMember: async (userId) => {
    const response = await api.post("/owner/approve-member", {
      user_id: userId,
    });
    return response.data;
  },

  rejectMember: async (userId, reason = null) => {
    const response = await api.post("/owner/reject-member", {
      user_id: userId,
      rejection_reason: reason,
    });
    return response.data;
  },

  reactivateRejectedMember: async (userId) => {
    const response = await api.post("/owner/reactivate-rejected", {
      user_id: userId,
    });
    return response.data;
  },

  deactivateMember: async (userId, reason) => {
    const response = await api.delete("/owner/deactivate-member", {
      data: { user_id: userId, rejection_reason: reason },
    });
    return response.data;
  },

  getValidationHistory: async () => {
    const response = await api.get("/owner/validation-history");
    return response.data;
  },

  getLeaderboard: async (limit = 100) => {
    const response = await api.get("/owner/leaderboard", { params: { limit } });
    return response.data;
  },

  // ==================== MENU MANAGEMENT ====================

  getMenus: async (filters = {}) => {
    const response = await api.get("/owner/menus", { params: filters });
    return response.data;
  },

  createMenu: async (data) => {
    const response = await api.post("/owner/menus", data);
    return response.data;
  },

  updateMenu: async (id, data) => {
    const response = await api.put(`/owner/menus/${id}`, data);
    return response.data;
  },

  deleteMenu: async (id) => {
    const response = await api.delete(`/owner/menus/${id}`);
    return response.data;
  },

  toggleMenuAvailability: async (id, availability) => {
    const response = await api.patch(`/owner/menus/${id}/availability`, {
      availability,
    });
    return response.data;
  },

  // ==================== FISH TYPE MANAGEMENT ====================

  getOwnerFishTypes: async (filters = {}) => {
    const response = await api.get("/owner/fish-types", { params: filters });
    return response.data;
  },

  createFishType: async (data) => {
    const response = await api.post("/owner/fish-types", data);
    return response.data;
  },

  updateFishType: async (id, data) => {
    const response = await api.put(`/owner/fish-types/${id}`, data);
    return response.data;
  },

  deleteFishType: async (id) => {
    const response = await api.delete(`/owner/fish-types/${id}`);
    return response.data;
  },

  toggleFishTypeActive: async (id) => {
    const response = await api.patch(`/owner/fish-types/${id}/toggle-active`);
    return response.data;
  },

  // ==================== FISH STOCK MANAGEMENT ====================

  getFishStocks: async () => {
    const response = await api.get("/owner/fish-stocks");
    return response.data;
  },

  restockFish: async (fishTypeId, data) => {
    const response = await api.post(
      `/owner/fish-stocks/${fishTypeId}/restock`,
      data,
    );
    return response.data;
  },

  updateFishThreshold: async (fishTypeId, data) => {
    const response = await api.patch(
      `/owner/fish-stocks/${fishTypeId}/threshold`,
      data,
    );
    return response.data;
  },

  getFishRestockHistory: async (fishTypeId) => {
    const response = await api.get(`/owner/fish-stocks/${fishTypeId}/history`);
    return response.data;
  },

  // ==================== EVENT MANAGEMENT ====================

  getOwnerEvents: async (filters = {}) => {
    const response = await api.get("/owner/events", { params: filters });
    return response.data;
  },

  createEvent: async (data) => {
    const response = await api.post("/owner/events", data, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await api.post(`/owner/events/${id}`, data, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/owner/events/${id}`);
    return response.data;
  },

  toggleEventPublish: async (id, status) => {
    const response = await api.patch(`/owner/events/${id}/publish`, { status });
    return response.data;
  },

  // ==================== VOUCHER MANAGEMENT ====================

  getVouchers: async (filters = {}) => {
    const response = await api.get("/owner/vouchers", { params: filters });
    return response.data;
  },

  getVoucherConfigs: async () => {
    const response = await api.get("/owner/voucher-configs");
    return response.data;
  },

  updateVoucherConfigs: async (data) => {
    const response = await api.put("/owner/voucher-configs", data);
    return response.data;
  },

  // ==================== REPORTS ====================

  getReportSummary: async (filters = {}) => {
    const response = await api.get("/owner/reports/summary", {
      params: filters,
    });
    return response.data;
  },

  getReportBreakdown: async (filters = {}) => {
    const response = await api.get("/owner/reports/breakdown", {
      params: filters,
    });
    return response.data;
  },

  getReportTransactions: async (filters = {}) => {
    const response = await api.get("/owner/reports/transactions", {
      params: filters,
    });
    return response.data;
  },

  getReportStockSummary: async (filters = {}) => {
    const response = await api.get("/owner/reports/stock-summary", {
      params: filters,
    });
    return response.data;
  },

  exportReportExcel: async (filters = {}) => {
    const response = await api.get("/owner/reports/export", {
      params: filters,
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "laporan.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default ownerService;
