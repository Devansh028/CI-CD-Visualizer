import API from "./axios";

const notificationApi = {
  /**
   * Fetch paginated notification history.
   */
  getNotifications: async (page = 1, limit = 20, isRead = null) => {
    const params = { page, limit };
    if (isRead !== null) {
      params.isRead = isRead;
    }
    const res = await API.get("/notifications", { params });
    return res.data;
  },

  /**
   * Fetch unread notification counts and payload lists.
   */
  getUnread: async () => {
    const res = await API.get("/notifications/unread");
    return res.data;
  },

  /**
   * Mark a single notification as read.
   */
  markRead: async (id) => {
    const res = await API.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all unread notifications as read.
   */
  markAllRead: async () => {
    const res = await API.patch("/notifications/read-all");
    return res.data;
  },

  /**
   * Delete a notification.
   */
  deleteNotification: async (id) => {
    const res = await API.delete(`/notifications/${id}`);
    return res.data;
  }
};

export default notificationApi;
