import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import NotificationPanel from "./NotificationPanel";

export const NotificationBell = () => {
  const { unreadCount, fetchUnread, initSocketListeners, cleanupSocketListeners } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    // 1. Fetch unread counts on mount
    fetchUnread();
    
    // 2. Initialize real-time notifications via WebSockets
    initSocketListeners();

    // 3. Close panel when clicking outside
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      cleanupSocketListeners();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchUnread, initSocketListeners, cleanupSocketListeners]);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg border text-gray-400 transition-all hover:text-gray-200 hover:bg-gray-800/80 active:scale-95 ${
          isOpen ? "bg-gray-800 text-gray-200 border-gray-700" : "border-gray-800/40 bg-gray-900/10"
        }`}
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-md ring-2 ring-gray-900 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Drops Down */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-80 md:w-96 origin-top-right rounded-xl bg-gray-950/95 border border-gray-850 p-4 shadow-2xl backdrop-blur-md animate-fade-in-down">
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
