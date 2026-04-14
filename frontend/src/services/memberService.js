import api from "./api";

const memberService = {
  async getProfile() {
    const response = await api.get("/member/profile");
    return response.data;
  },

  async getLeaderboard({ page = 1, per_page = 50 } = {}) {
    const response = await api.get("/leaderboard", { params: { page, per_page } });
    return response.data;
  },

  async getMenus() {
    const response = await api.get("/menus");
    return response.data;
  },

  async createOrder(data) {
    // data: { items: [{ menu_id, quantity }] }
    const response = await api.post("/member/orders", data);
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get("/member/orders");
    return response.data;
  },

  getTransactionHistory: async (params = {}) => {
    const response = await api.get("/member/transactions", { params });
    return response.data;
  },

  getVouchers: async () => {
    const response = await api.get("/member/vouchers");
    return response.data;
  },
};

export default memberService;
