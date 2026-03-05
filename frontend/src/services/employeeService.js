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
  getAllPendingOrders: async () => {
    const response = await api.get("/employee/pending-orders");
    return response.data;
  },

  // ==================== TRANSACTION ====================

  checkout: async (data) => {
    const response = await api.post("/employee/checkout", data);
    return response.data;
  },

  getTransactions: async (params = {}) => {
    const response = await api.get("/employee/transactions", {
      params,
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
  updateOrderStatus: async (id, data) => {
    // data: { status, cancellation_reason (opsional) }
    const response = await api.patch(
      `/employee/pending-orders/${id}/status`,
      data,
    );
    return response.data;
  },
  updateMenuAvailability: async (id) => {
    const response = await api.patch(`/employee/menus/${id}/availability`);
    return response.data;
  },
  getAllMenus: async () => {
    const response = await api.get("/employee/menus");
    return response.data;
  },

  // ==================== VOUCHER ====================

  getMemberVoucher: async (memberId) => {
    const response = await api.get(`/employee/member-voucher/${memberId}`);
    return response.data;
  },

  // ==================== NOTIFICATION ====================

  getFishStocks: async () => {
    const response = await api.get("/employee/fish-stocks");
    return response.data;
  },
};

export default employeeService;
