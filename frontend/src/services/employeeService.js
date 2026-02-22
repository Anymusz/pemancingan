import api from "./api";

const employeeService = {
  // ==================== ARRIVAL ====================

  checkInMember: async (data) => {
    const response = await api.post("/employee/check-in", data);
    return response.data;
  },

  getTodayArrivals: async (filters = {}) => {
    const response = await api.get("/employee/today-arrivals", {
      params: filters,
    });
    return response.data;
  },

  checkOutMember: async (arrivalId, notes = null) => {
    const response = await api.post(`/employee/check-out/${arrivalId}`, {
      notes,
    });
    return response.data;
  },

  searchMember: async (query) => {
    const response = await api.get("/employee/search-member", {
      params: { query },
    });
    return response.data;
  },

  searchArrival: async (query) => {
    const response = await api.get("/employee/search-arrival", {
      params: { query },
    });
    return response.data;
  },

  // ==================== PENDING ORDERS ====================

  createPendingOrder: async (data) => {
    // data: { arrival_id, item_type, item_id (jika menu), quantity }
    const response = await api.post("/employee/pending-orders", data);
    return response.data;
  },

  getPendingOrders: async (arrivalId) => {
    const response = await api.get(`/employee/pending-orders/${arrivalId}`);
    return response.data;
  },

  // ==================== TRANSACTION ====================

  checkout: async (data) => {
    // data: { arrival_id, fish_items, penalty_items, payment_method, tips, notes }
    const response = await api.post("/employee/checkout", data);
    return response.data;
  },

  getTransactions: async (filters = {}) => {
    const response = await api.get("/employee/transactions", {
      params: filters,
    });
    return response.data;
  },

  getTransactionDetail: async (id) => {
    const response = await api.get(`/employee/transactions/${id}`);
    return response.data;
  },

  getFishTypes: async () => {
    const response = await api.get("/fish-types");
    return response.data;
  },

  getMenus: async () => {
    const response = await api.get("/menus");
    return response.data;
  },
};

export default employeeService;
