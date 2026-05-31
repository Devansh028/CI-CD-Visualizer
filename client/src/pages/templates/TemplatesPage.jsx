import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getTemplates } from "../../api/templateApi";
import { 
  Rocket, 
  Cpu, 
  Terminal, 
  Settings, 
  Globe, 
  ArrowRight, 
  Loader2,
  Code
} from "lucide-react";

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await getTemplates();
        setTemplates(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load deployment templates. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleDeploy = (templateId) => {
    navigate(`/projects/new?templateId=${templateId}`);
  };

  // Helper to map frameworks to specific background gradients or colors
  const getFrameworkColor = (framework) => {
    const fw = framework.toLowerCase();
    if (fw.includes("react") || fw.includes("vite")) return "from-cyan-500/20 to-blue-600/20 text-cyan-400 border-cyan-500/20";
    if (fw.includes("node") || fw.includes("express") || fw.includes("nest")) return "from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/20";
    if (fw.includes("next")) return "from-gray-500/20 to-slate-800/20 text-gray-300 border-gray-500/20";
    if (fw.includes("flask") || fw.includes("fastapi") || fw.includes("python") || fw.includes("django")) return "from-yellow-500/20 to-amber-600/20 text-yellow-400 border-yellow-500/20";
    if (fw.includes("spring") || fw.includes("java")) return "from-orange-500/20 to-red-600/20 text-orange-400 border-orange-500/20";
    if (fw.includes("go")) return "from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/20";
    return "from-purple-500/20 to-indigo-600/20 text-purple-400 border-purple-500/20";
  };

  // Helper for framework descriptive details
  const getTemplateDescription = (name) => {
    switch (name) {
      case "React App": return "Single Page App compiled with Vite/Webpack and served via Nginx static server.";
      case "Node API": return "Scalable backend Node.js REST API with automated package dependency resolution.";
      case "MERN App": return "Full stack Mongo-Express-React-Node architecture with static build pipelines.";
      case "Next.js App": return "Next.js server-side rendered application with routing and asset optimization.";
      case "Flask API": return "Lightweight Python Flask web server with requirements resolution.";
      case "FastAPI": return "Modern, high-performance Python FastAPI service running under Uvicorn.";
      case "Spring Boot": return "Enterprise-grade Java Spring Boot application built with Maven or Gradle.";
      case "Go Service": return "Ultra-fast compiled Golang binary running inside a minimal Alpine container.";
      default: return "Pre-configured environment optimized for production builds and deployments.";
    }
  };

  return (
    <AppLayout 
      sidebarInfo={{
        title: "Marketplace info",
        description: "Choose a deployment template to instantly preconfigure your pipeline settings.",
        status: "Active",
        statusLabel: "Templates Available",
        statusColor: "text-emerald-400",
        statusDot: true,
        statusDotColor: "bg-emerald-500"
      }}
    >
      <div className="relative min-h-screen">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"></div>

        {/* Page Title Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent flex items-center gap-3">
            <Rocket className="h-7 w-7 text-purple-500 animate-pulse" />
            Deployment Template Marketplace
          </h1>
          <p className="text-sm text-gray-400 font-light mt-2 max-w-2xl leading-relaxed">
            Skip manual configuration. Launch production-ready microservices, frontend applications, and APIs in seconds. Select a template to pre-configure ports, build pipelines, and containerization strategies.
          </p>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            <p className="text-xs text-gray-500 font-medium">Fetching templates from catalog...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center max-w-xl mx-auto my-12 backdrop-blur-xl">
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition duration-200 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {templates.map((tpl) => (
              <div 
                key={tpl._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-[#0e1017]/70 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/30 hover:bg-[#12141c]/90 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              >
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors duration-200">
                      {tpl.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getFrameworkColor(tpl.framework)}`}>
                      {tpl.framework}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 leading-relaxed font-light mb-6">
                    {getTemplateDescription(tpl.name)}
                  </p>

                  {/* Core Settings / Spec List */}
                  <div className="space-y-3 border-t border-white/5 pt-4 mb-6">
                    {/* Build Command */}
                    <div className="flex items-center text-[11px] text-gray-500">
                      <Terminal className="h-3.5 w-3.5 mr-2 shrink-0 text-purple-500/70" />
                      <span className="font-semibold text-gray-400 mr-1.5">Build:</span>
                      <code className="text-gray-300 truncate font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5 max-w-[150px]">
                        {tpl.buildCommand || "None"}
                      </code>
                    </div>

                    {/* Start Command */}
                    <div className="flex items-center text-[11px] text-gray-500">
                      <Settings className="h-3.5 w-3.5 mr-2 shrink-0 text-indigo-500/70" />
                      <span className="font-semibold text-gray-400 mr-1.5">Start:</span>
                      <code className="text-gray-300 truncate font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5 max-w-[150px]">
                        {tpl.startCommand || "None"}
                      </code>
                    </div>

                    {/* Strategy / Docker template */}
                    <div className="flex items-center text-[11px] text-gray-500">
                      <Cpu className="h-3.5 w-3.5 mr-2 shrink-0 text-pink-500/70" />
                      <span className="font-semibold text-gray-400 mr-1.5">Strategy:</span>
                      <span className="text-gray-300 font-medium capitalize">{tpl.dockerTemplate}</span>
                    </div>

                    {/* Default Port */}
                    <div className="flex items-center text-[11px] text-gray-500">
                      <Globe className="h-3.5 w-3.5 mr-2 shrink-0 text-cyan-500/70" />
                      <span className="font-semibold text-gray-400 mr-1.5">Default Port:</span>
                      <span className="text-gray-300 font-mono font-medium">{tpl.defaultPort}</span>
                    </div>
                  </div>
                </div>

                {/* Deploy Button */}
                <button
                  onClick={() => handleDeploy(tpl._id)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/5 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 py-3 text-xs font-bold text-purple-400 hover:text-white border border-purple-500/20 hover:border-transparent transition-all duration-300 active:scale-[0.98] cursor-pointer"
                >
                  Deploy Template
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            ))}

            {/* Custom Blank Option */}
            <div 
              className="group relative flex flex-col justify-between rounded-2xl border border-dashed border-white/10 bg-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/30 hover:bg-[#12141c]/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors duration-200">
                    Blank Project
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 text-gray-400">
                    Custom
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed font-light mb-6">
                  Set up a project completely from scratch. Manually define framework, build commands, Dockerfile path, and container settings.
                </p>
                
                <div className="flex items-center justify-center py-10 text-gray-600 group-hover:text-purple-500/30 transition-colors duration-300">
                  <Code className="h-16 w-16" />
                </div>
              </div>

              <button
                onClick={() => navigate("/projects/new")}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 py-3 text-xs font-bold text-gray-300 hover:text-white border border-white/5 hover:border-white/10 transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                Configure Custom Setup
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TemplatesPage;
