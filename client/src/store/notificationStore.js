import { create } from "zustand";
import notificationApi from "../api/notificationApi";
import socketService from "../services/socket";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  error: null,
  toasts: [], // For floating toast notifications

  // Fetch paginated history
  fetchNotifications: async (page = 1, limit = 20) => {
    try {
      set({ isLoading: true, error: null });
      const data = await notificationApi.getNotifications(page, limit);
      set({
        notifications: data.notifications,
        total: data.total,
        page: data.page,
        pages: data.pages,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || "Failed to load notifications",
      });
    }
  },

  // Fetch unread count and latest unread list
  fetchUnread: async () => {
    try {
      const data = await notificationApi.getUnread();
      set({ unreadCount: data.count });
    } catch (err) {
      console.error("Failed to fetch unread notification counts:", err);
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      await notificationApi.markRead(id);
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
      // Revert in case of failure (or refresh)
      get().fetchNotifications(get().page);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
      await notificationApi.markAllRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      get().fetchNotifications(get().page);
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      const target = get().notifications.find(n => n._id === id);
      const wasUnread = target && !target.isRead;

      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }));
      await notificationApi.deleteNotification(id);
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err);
      get().fetchNotifications(get().page);
    }
  },

  // Toast controls
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, severity: "info", ...toast };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Socket listener registration
  initSocketListeners: () => {
    // Connect to WebSocket client
    const socket = socketService.connect();
    if (!socket) return;

    // Listen for new user notifications
    socketService.on("notification:new", (notification) => {
      // 1. Play audio ping safely (ignore if browser blocks audio autoplay)
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
        audio.volume = 0.25;
        audio.play().catch(() => {});
      } catch (err) {
        // Autoplay policy blocker
      }

      // 2. Add to local list and increment unread badge count
      set((state) => {
        const updatedList = [notification, ...state.notifications];
        // Limit page cache size
        if (updatedList.length > 20) updatedList.pop();
        
        return {
          notifications: updatedList,
          unreadCount: state.unreadCount + 1,
          total: state.total + 1
        };
      });

      // 3. Display floating toast popup
      get().addToast({
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        metadata: notification.metadata
      });
    });
  },

  // Clean listeners
  cleanupSocketListeners: () => {
    socketService.off("notification:new");
  }
}));
