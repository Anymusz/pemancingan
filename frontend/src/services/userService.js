// File: src/services/userService.js

import api from "./api";

const userService = {
  updateProfile: async (data) => {
    const response = await api.put("/user/profile", data);
    return response.data;
  },

  updatePassword: async (data) => {
    const response = await api.put("/user/password", data);
    return response.data;
  },
};

export default userService;
