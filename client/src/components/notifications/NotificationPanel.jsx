import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Trash2, BellOff, ArrowRight } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import NotificationItem from "./NotificationItem";

export const NotificationPanel = ({ onClose }) => {
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification,
    unreadCount 
  } = useNotificationStore();

  // Load latest notifications on panel render
  useEffect(() => {
    fetchNotifications(1, 5); // Load top 5 latest
  }, [fetchNotifications]);

  const handleMarkAllRead = (e) => {
    e.preventDefault();
    markAllAsRead();
  };

  return (
    <div className="flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-200">Alerts Dashboard</h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1 divide-y divide-gray-900/55 scrollbar-thin scrollbar-thumb-gray-800">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
            <span className="text-xs">Loading alerts...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 gap-2">
            <div className="p-2 bg-gray-900 rounded-full text-gray-600">
              <BellOff size={18} />
            </div>
            <span className="text-xs font-semibold">All quiet for now</span>
            <span className="text-[10px] text-gray-600">You don't have any notifications.</span>
          </div>
        ) : (
          notifications.slice(0, 5).map((item) => (
            <NotificationItem
              key={item._id}
              item={item}
              onMarkRead={() => markAsRead(item._id)}
              onDelete={() => deleteNotification(item._id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800/80 pt-3 mt-2">
        <Link
          to="/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full text-center text-xs font-bold py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-850 hover:text-gray-100 hover:border-gray-700 transition-all active:scale-98 shadow-sm"
        >
          View all notifications
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;
