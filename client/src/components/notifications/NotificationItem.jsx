import React from "react";
import { Check, Trash2, ShieldAlert, CheckCircle, AlertTriangle, Info } from "lucide-react";

/**
 * Format timestamp into relative readable duration.
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs) || diffMs < 0) return "Just now";

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const NotificationItem = ({ item, onMarkRead, onDelete }) => {
  const severityStyles = {
    success: {
      border: "border-l-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      icon: CheckCircle
    },
    error: {
      border: "border-l-red-500",
      bg: "bg-red-500/10",
      text: "text-red-400",
      icon: ShieldAlert
    },
    warning: {
      border: "border-l-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      icon: AlertTriangle
    },
    info: {
      border: "border-l-indigo-500",
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      icon: Info
    }
  };

  const style = severityStyles[item.severity] || severityStyles.info;
  const SeverityIcon = style.icon;

  return (
    <div
      className={`group flex items-start gap-3 p-3 border-l-2 transition-all hover:bg-gray-900/60 ${
        style.border
      } ${!item.isRead ? "bg-gray-850/45 border-gray-850" : "bg-transparent border-transparent"}`}
    >
      {/* Icon Badge */}
      <div className={`p-1.5 rounded-lg border border-gray-850/50 shrink-0 ${style.bg} ${style.text}`}>
        <SeverityIcon size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-relaxed truncate ${!item.isRead ? "text-gray-200" : "text-gray-400"}`}>
            {item.title}
          </p>
          <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0 pt-0.5">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-normal break-words">
          {item.message}
        </p>
        
        {item.projectId && (
          <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-900 border border-gray-800 text-gray-400 uppercase">
            Project: {item.projectId.name || "N/A"}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!item.isRead && onMarkRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            title="Mark as read"
            className="p-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <Check size={11} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete notification"
            className="p-1 rounded bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
