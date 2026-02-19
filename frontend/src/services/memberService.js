import api from "./api";

const memberService = {
  async getProfile() {
    const response = await api.get("/member/profile");
    return response.data;
  },

  async getLeaderboard(limit = 10) {
    const response = await api.get("/leaderboard", {
      params: { limit },
    });
    return response.data;
  },
};

export default memberService;
