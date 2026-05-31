import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  Terminal,
  LogOut,
  Layers,
  Globe,
  Activity,
  HardDrive,
  Rocket,
  Users,
  FileSpreadsheet,
  Network,
  Cloud,
  Code,
  Archive,
  TrendingUp,
  Key,
  ShieldAlert,
  Server
} from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";

const AppLayout = ({ children, sidebarInfo }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const coreNavItems = [
    { label: "Projects Dashboard", path: "/", icon: Layers },
    { label: "Template Marketplace", path: "/templates", icon: Rocket },
    { label: "Team Collaboration", path: "/organizations", icon: Users },
    { label: "System Audit Trail", path: "/audit", icon: FileSpreadsheet },
    { label: "Domains Manager", path: "/domains", icon: Globe },
    { label: "Monitoring Dashboard", path: "/dashboard", icon: Activity },
    { label: "Docker Images", path: "/images", icon: HardDrive },
  ];

  const cloudNativeNavItems = [
    { label: "K8s Visualizer", path: "/k8s/visualizer", icon: Network },
    { label: "K8s Manager", path: "/k8s/manager", icon: Server },
    { label: "Multi-Cloud Deploy", path: "/cloud", icon: Cloud },
    { label: "Infrastructure as Code", path: "/iac", icon: Code },
    { label: "Container Registry", path: "/registry", icon: Archive },
    { label: "Auto-Scaling Engine", path: "/scaling", icon: TrendingUp },
    { label: "Developer Portal", path: "/dev", icon: Key },
    { label: "SaaS Admin Dashboard", path: "/saas", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex overflow-hidden font-sans">
      {/* Sidebar - fixed width 288px (w-72) */}
      <aside className="w-72 shrink-0 border-r border-white/5 bg-[#0e1017]/40 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto z-40">
        <div className="p-6 space-y-6">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              CI/CD Visualizer
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2">
              Core Platform
            </h3>
            <nav className="flex flex-col gap-1">
              {coreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition duration-200 ${
                      isActive
                        ? "bg-white/5 text-purple-400 font-semibold"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive && item.label === "Monitoring Dashboard" ? "animate-pulse" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2">
              Cloud Native Suite
            </h3>
            <nav className="flex flex-col gap-1">
              {cloudNativeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition duration-200 ${
                      isActive
                        ? "bg-white/5 text-indigo-400 font-semibold"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer / Info Box */}
        {sidebarInfo && (
          <div className="p-6 border-t border-white/5">
            <div className="rounded-xl border border-white/5 bg-[#0e1017]/40 p-4 backdrop-blur-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2 px-1">
                {sidebarInfo.title}
              </h3>
              <div className="space-y-3 px-1 text-[11px] text-gray-400 font-light leading-relaxed">
                <p>{sidebarInfo.description}</p>
                {sidebarInfo.status && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-500 mt-2">
                    <span>{sidebarInfo.statusLabel || "Status"}</span>
                    <span className={`${sidebarInfo.statusColor || "text-purple-400"} flex items-center gap-1`}>
                      {sidebarInfo.statusDot && <span className={`h-1.5 w-1.5 rounded-full ${sidebarInfo.statusDotColor || "bg-purple-500"}`}></span>}
                      {sidebarInfo.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex-1 min-w-0 flex flex-col min-h-screen bg-[#07080d] overflow-y-auto">
        {/* Navbar */}
        <header className="border-b border-white/5 bg-[#0e1017]/80 backdrop-blur-xl h-16 flex items-center justify-between px-6 sticky top-0 z-50 shrink-0">
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2 border-r border-white/5 pr-4">
              <img
                src={user?.avatar || "https://api.dicebear.com/7.x/bottts/svg"}
                alt={user?.name}
                className="h-8 w-8 rounded-lg border border-purple-500/20 bg-purple-950/20"
              />
              <span className="text-xs text-gray-300 font-medium hidden md:inline">
                {user?.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition duration-200 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Page Content wrapper */}
        <div className="p-6 w-full min-w-0 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
