import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  Layers, 
  Globe, 
  Activity, 
  HardDrive, 
  Check, 
  Trash2, 
  LogOut, 
  Terminal,
  ChevronLeft,
  ChevronRight,
  BellOff
} from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import { useAuthStore } from "../../store/authStore";
import NotificationItem from "../../components/notifications/NotificationItem";
import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import AppLayout from "../../components/layout/AppLayout";
import EmptyState from "../../components/common/EmptyState";

export const NotificationsPage = () => {
  const { 
    notifications, 
    total, 
    page, 
    pages, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    unreadCount 
  } = useNotificationStore();
  const { user, logout } = useAuthStore();
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    fetchNotifications(1, 10);
  }, [fetchNotifications]);

  const handleFilterChange = (type) => {
    setFilter(type);
    // Actually the API doesn't support filter by read/unread yet, but let's filter locally or fetch with query
    // Wait, the API GET /api/notifications does support query parameter `isRead`!
    // Let's call fetchNotifications with page and optional params inside the store if needed.
    // Wait, let's look at `getNotifications` in notificationStore:
    // It calls `notificationApi.getNotifications(page, limit)`.
    // Let's modify the store to support status filtering or just filter locally! Filtering locally on the page is very easy, or we can fetch.
    // Let's filter locally for simplicity and speed:
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      fetchNotifications(newPage, 10);
    }
  };

  const sidebarInfo = {
    title: "Notifications Info",
    description: "Module 13 delivers real-time notifications via secure Socket.IO namespaces to ensure user alerting in multi-tenant contexts.",
    status: "Operational",
    statusColor: "text-purple-500",
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      {/* Content Area */}
      <section className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Bell className="text-purple-400" size={24} />
                Notifications Center
              </h1>
              <p className="text-xs text-gray-400 font-light mt-1">Audit trail and history of deployment events, errors, and system tasks</p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-lg border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            {["all", "unread", "read"].map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  filter === type 
                    ? "bg-purple-600/15 border border-purple-500/30 text-purple-400" 
                    : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/40 backdrop-blur-xl overflow-hidden shadow-xl">
            {isLoading && filteredNotifications.length === 0 ? (
              <div className="p-8">
                <LoadingSkeleton type="row" count={4} />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16">
                <EmptyState 
                  title="No notifications matching filter" 
                  description="You are all caught up! No recent system events or errors were reported." 
                  icon={BellOff} 
                />
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredNotifications.map((item) => (
                  <NotificationItem
                    key={item._id}
                    item={item}
                    onMarkRead={() => markAsRead(item._id)}
                    onDelete={() => deleteNotification(item._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-gray-500 font-light">
                Showing page {page} of {pages} ({total} total alerts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => handlePageChange(page - 1)}
                  className="p-1.5 rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === pages || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  className="p-1.5 rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </section>
    </AppLayout>
  );
};

export default NotificationsPage;
