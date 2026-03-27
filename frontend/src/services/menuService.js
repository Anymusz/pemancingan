import api from "./api";

const menuService = {
  getMenus: async (params = {}) => {
    const response = await api.get("/owner/menus", { params });
    return response.data;
  },

  createMenu: async (formData) => {
    const response = await api.post("/owner/menus", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  updateMenu: async (id, formData) => {
    formData.append("_method", "PUT");
    const response = await api.post(`/owner/menus/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
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
};

export default menuService;
