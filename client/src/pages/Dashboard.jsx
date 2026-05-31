import { useAuthStore } from "../store/authStore";
import { LogOut, Terminal, Shield, Mail, Calendar, Activity } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#07080d] text-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-white/5 bg-[#0e1017]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              CI/CD Visualizer
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        {/* Welcome Banner Card */}
        <div className="relative rounded-2xl border border-white/5 bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-transparent p-8 shadow-2xl backdrop-blur-xl mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-purple-500/5 blur-[50px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 mb-4 border border-purple-500/20">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                Auth System Online
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-400 text-sm max-w-md font-light">
                Your CI/CD workflow automation session has been authenticated successfully.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-md">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-14 w-14 rounded-xl border border-purple-500/30 bg-[#0e1017]"
              />
              <div>
                <div className="font-bold text-sm">{user?.name}</div>
                <div className="text-xs text-purple-400 font-mono tracking-wider uppercase mt-0.5">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/60 p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold tracking-wider text-purple-400 uppercase mb-4">
              Session Profile
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Email Address</div>
                  <div className="text-sm text-gray-300 font-medium">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Access Level</div>
                  <div className="text-sm text-gray-300 font-medium capitalize">{user?.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Registered On</div>
                  <div className="text-sm text-gray-300 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#0e1017]/60 p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-wider text-purple-400 uppercase mb-3">
                Next Modules
              </h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Module 1 is complete! The remaining modules include the Project & Pipeline configuration system, the real-time runner container daemon (using Dockerode and Redis queue), and the React Flow interface.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
              <span>Stack: Zustand, React, Express, JWT</span>
              <span className="text-green-500 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                Secure
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
