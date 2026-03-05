import api from "./api";

const notificationService = {
  getNotifications: async (page = 1) => {
    const response = await api.get("/notifications", {
      params: { page, per_page: 20 },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },
};

export default notificationService;
