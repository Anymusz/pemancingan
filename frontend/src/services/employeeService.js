// File: src/services/employeeService.js

import api from "./api";

const employeeService = {
  // ==================== ARRIVAL ====================

  checkInMember: async (data) => {
    // data: { member_id, notes }
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

  // ==================== TRANSACTION ====================

  checkout: async (data) => {
    // data: { arrival_id, items, payment_method, tips, notes }
    const response = await api.post("/employee/checkout", data);
    return response.data;
  },

  getTransactions: async (filters = {}) => {
    // filters: { member_id, date_from, date_to, payment_method, limit }
    const response = await api.get("/employee/transactions", {
      params: filters,
    });
    return response.data;
  },

  getTransactionDetail: async (id) => {
    const response = await api.get(`/employee/transactions/${id}`);
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

  getFishTypes: async () => {
    const response = await api.get("/fish-types");
    return response.data;
  },
};

export default employeeService;
