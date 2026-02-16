import api from "./api";

const ownerService = {
  /**
   * Get list of pending members waiting for validation
   */
  getPendingMembers: async () => {
    const response = await api.get("/owner/pending-members");
    return response.data;
  },

  /**
   * Approve a pending member
   */
  approveMember: async (userId) => {
    const response = await api.post("/owner/approve-member", {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Reject a pending member
   */
  rejectMember: async (userId, reason = null) => {
    const response = await api.post("/owner/reject-member", {
      user_id: userId,
      rejection_reason: reason,
    });
    return response.data;
  },

  /**
   * Reactivate a rejected member for review
   */
  reactivateRejectedMember: async (userId) => {
    const response = await api.post("/owner/reactivate-rejected", {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Deactivate an active member
   */
  deactivateMember: async (userId, reason) => {
    const response = await api.delete("/owner/deactivate-member", {
      data: {
        user_id: userId,
        rejection_reason: reason,
      },
    });
    return response.data;
  },

  /**
   * Get validation history (approved & rejected members)
   */
  getValidationHistory: async () => {
    const response = await api.get("/owner/validation-history");
    return response.data;
  },
};

export default ownerService;
