import React from "react";
import { X, CheckCircle, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";

export const ToastNotification = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  const severityStyles = {
    success: {
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      bg: "bg-gray-950/95 border-l-4 border-l-emerald-500",
      icon: CheckCircle
    },
    error: {
      border: "border-red-500/30",
      iconColor: "text-red-400",
      bg: "bg-gray-950/95 border-l-4 border-l-red-500",
      icon: ShieldAlert
    },
    warning: {
      border: "border-amber-500/30",
      iconColor: "text-amber-400",
      bg: "bg-gray-950/95 border-l-4 border-l-amber-500",
      icon: AlertTriangle
    },
    info: {
      border: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      bg: "bg-gray-950/95 border-l-4 border-l-indigo-500",
      icon: Info
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = severityStyles[toast.severity] || severityStyles.info;
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all pointer-events-auto animate-slide-in ${style.bg} ${style.border}`}
          >
            {/* Severity Icon */}
            <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
              <Icon size={16} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-gray-200 leading-none mb-1">
                {toast.title}
              </h5>
              <p className="text-[11px] text-gray-400 leading-normal break-words">
                {toast.message}
              </p>
            </div>

            {/* Close Trigger */}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-900 transition-all shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotification;
