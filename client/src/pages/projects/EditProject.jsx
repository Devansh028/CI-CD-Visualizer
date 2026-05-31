import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useProjectStore } from "../../store/projectStore";
import { ArrowLeft, Plus, Trash2, Loader2, Copy, Check, Info } from "lucide-react";
import { detectFramework } from "../../api/frameworkApi";

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fetchProjectById, updateProject, isLoading, error, clearError } = useProjectStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [framework, setFramework] = useState("node");
  const [dockerfilePath, setDockerfilePath] = useState("./Dockerfile");
  const [deployPort, setDeployPort] = useState("3000");
  const [envVars, setEnvVars] = useState([]);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [validationError, setValidationError] = useState("");
  const [fetchingDetails, setFetchingDetails] = useState(true);
  const [copiedField, setCopiedField] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  const handleAutoDetect = async () => {
    if (!repoUrl) {
      alert("Please enter a repository URL first.");
      return;
    }
    try {
      setIsDetecting(true);
      const response = await detectFramework({ repoUrl, branch });
      if (response && response.framework) {
        setFramework(response.framework);
        const portDefaults = {
          "Next.js": 3000,
          "Node.js": 5000,
          "Express": 5000,
          "NestJS": 3000,
          "Flask": 5000,
          "Django": 8000,
          "FastAPI": 8000,
          "Spring Boot": 8080,
          "Go": 8080,
          "Static Websites": 80,
          "React": 80,
          "Vite": 80
        };
        if (portDefaults[response.framework]) {
          setDeployPort(String(portDefaults[response.framework]));
        }
        alert(`Successfully detected framework: ${response.framework}`);
      }
    } catch (err) {
      console.error(err);
      alert("Framework detection failed. Please select manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  useEffect(() => {
    clearError();
    const loadProject = async () => {
      try {
        setFetchingDetails(true);
        const project = await fetchProjectById(id);
        setName(project.name);
        setDescription(project.description || "");
        setRepoUrl(project.repoUrl);
        setBranch(project.branch || "main");
        setFramework(project.framework || "node");
        setDockerfilePath(project.dockerfilePath || "./Dockerfile");
        setDeployPort(String(project.deployPort));
        setEnvVars(project.environmentVariables || []);
        setAutoDeploy(project.autoDeploy || false);
        setWebhookSecret(project.webhookSecret || "");
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setFetchingDetails(false);
      }
    };
    loadProject();
  }, [id, fetchProjectById, clearError]);

  const handleAddEnv = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const handleRemoveEnv = (index) => {
    const updated = envVars.filter((_, idx) => idx !== index);
    setEnvVars(updated);
  };

  const handleEnvChange = (index, field, val) => {
    const updated = envVars.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setEnvVars(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!name || !repoUrl || !deployPort) {
      setValidationError("Project Name, GitHub Repo URL, and Deploy Port are required fields.");
      return;
    }

    const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?\/?$/;
    if (!githubRegex.test(repoUrl)) {
      setValidationError("Invalid URL format. Please provide a valid GitHub repository URL.");
      return;
    }

    const portNum = Number(deployPort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setValidationError("Deploy Port must be a numeric value between 1 and 65535.");
      return;
    }

    // Filter out incomplete environment variable rows
    const filteredEnvVars = envVars.filter(item => item.key.trim() !== "");

    try {
      setValidationError("");
      await updateProject(id, {
        name: name.trim(),
        description: description.trim(),
        repoUrl: repoUrl.trim(),
        branch: branch.trim(),
        framework,
        dockerfilePath: dockerfilePath.trim(),
        deployPort: portNum,
        environmentVariables: filteredEnvVars,
        autoDeploy,
        webhookSecret,
      });
      navigate("/");
    } catch (err) {
      // Error handles inside Zustand store
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07080d] px-4 text-white overflow-hidden py-12">
      {/* Background Neon Gradients */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-purple-400 mb-6 transition duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Edit Project Settings</h1>
          <p className="text-xs text-gray-400 font-light mt-1">Modify configurations for "{name || 'Project'}"</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0e1017]/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {fetchingDetails ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
              <p className="text-xs font-medium uppercase tracking-wider animate-pulse">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Show errors */}
              {(error || validationError) && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-400">
                  {validationError || error}
                </div>
              )}

              {/* Form elements grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Project Name */}
                <div>
                  <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Project Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                    placeholder="TaskFlow API"
                    required
                  />
                </div>

                {/* GitHub Repo URL */}
                <div>
                  <label htmlFor="repoUrl" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    GitHub Repo URL *
                  </label>
                  <input
                    id="repoUrl"
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                    placeholder="https://github.com/dev/taskflow"
                    required
                  />
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Default Branch *
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                    placeholder="main"
                    required
                  />
                </div>

                {/* Framework */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="framework" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Framework *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetect}
                      disabled={isDetecting || !repoUrl}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 cursor-pointer"
                      title="Enter repository URL first to enable auto-detection"
                    >
                      {isDetecting ? "Detecting..." : "Auto-Detect"}
                    </button>
                  </div>
                  <select
                    id="framework"
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-300 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300 cursor-pointer"
                  >
                    <option value="Node.js">Node.js</option>
                    <option value="React">React</option>
                    <option value="Vite">Vite</option>
                    <option value="Next.js">Next.js</option>
                    <option value="Express">Express</option>
                    <option value="NestJS">NestJS</option>
                    <option value="Flask">Flask</option>
                    <option value="Django">Django</option>
                    <option value="FastAPI">FastAPI</option>
                    <option value="Spring Boot">Spring Boot</option>
                    <option value="Go">Go</option>
                    <option value="Static Websites">Static Websites</option>
                  </select>
                </div>

                {/* Dockerfile Path */}
                <div>
                  <label htmlFor="dockerfilePath" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Dockerfile Path *
                  </label>
                  <input
                    id="dockerfilePath"
                    type="text"
                    value={dockerfilePath}
                    onChange={(e) => setDockerfilePath(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                    placeholder="./Dockerfile"
                    required
                  />
                </div>

                {/* Deploy Port */}
                <div>
                  <label htmlFor="deployPort" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Deploy Port *
                  </label>
                  <input
                    id="deployPort"
                    type="number"
                    value={deployPort}
                    onChange={(e) => setDeployPort(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                    placeholder="3000"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition duration-300"
                  placeholder="A brief description of what this deployment service does..."
                />
              </div>

              {/* Auto Deploy Config Section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-md">
                  <input
                    id="autoDeploy"
                    type="checkbox"
                    checked={autoDeploy}
                    onChange={(e) => setAutoDeploy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/10 bg-[#12141c]/90 text-purple-600 focus:ring-purple-500/80 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="autoDeploy" className="block text-xs font-bold text-gray-200 cursor-pointer">
                      Enable Auto Deploy (GitHub Webhook)
                    </label>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Automatically triggers the pipeline deployment runner whenever new code is pushed to your configured branch.
                    </p>
                  </div>
                </div>

                {autoDeploy && (
                  <div className="rounded-xl border border-white/5 bg-purple-950/10 p-5 space-y-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                      <Info className="h-4 w-4 shrink-0" />
                      <span>GitHub Webhook Configuration Instructions</span>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                      To activate automatic build triggers, navigate to your GitHub Repository Settings → Webhooks → Add Webhook. Setup the configuration using the fields below.
                    </p>

                    {/* Payload URL Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Payload URL</label>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${window.location.origin.replace(':5173', ':5000')}/api/webhooks/github`, "payloadUrl")}
                          className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                        >
                          {copiedField === "payloadUrl" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          {copiedField === "payloadUrl" ? "Copied" : "Copy URL"}
                        </button>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin.replace(':5173', ':5000')}/api/webhooks/github`}
                        className="block w-full rounded border border-white/5 bg-[#0b0c10] py-1.5 px-2.5 text-xs font-mono text-gray-400 focus:outline-none select-all"
                      />
                    </div>

                    {/* Webhook Secret Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Secret Token</label>
                        <button
                          type="button"
                          onClick={() => handleCopy(webhookSecret, "secret")}
                          className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                        >
                          {copiedField === "secret" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          {copiedField === "secret" ? "Copied" : "Copy Secret"}
                        </button>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={webhookSecret}
                        className="block w-full rounded border border-white/5 bg-[#0b0c10] py-1.5 px-2.5 text-xs font-mono text-gray-400 focus:outline-none select-all"
                      />
                    </div>

                    <div className="text-[10px] text-gray-500 leading-normal font-light">
                      * Ensure content type is configured as <span className="font-semibold text-gray-300 font-mono">application/json</span> on GitHub.
                    </div>
                  </div>
                )}
              </div>

              {/* Env Variables */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold">Environment Variables</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Inject key-value variables into the deployment container context</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEnv}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 rounded transition duration-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Variable
                  </button>
                </div>

                {/* Env Vars inputs list */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {envVars.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic px-2">No variables configured.</p>
                  ) : (
                    envVars.map((env, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={env.key}
                          onChange={(e) => handleEnvChange(idx, "key", e.target.value)}
                          placeholder="KEY (e.g. MONGO_URI)"
                          className="flex-1 rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs placeholder-gray-600 text-gray-200 focus:border-purple-500/85 focus:outline-none focus:ring-1 focus:ring-purple-500/85 transition duration-200"
                        />
                        <input
                          type="text"
                          value={env.value}
                          onChange={(e) => handleEnvChange(idx, "value", e.target.value)}
                          placeholder="value"
                          className="flex-1 rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs placeholder-gray-600 text-gray-200 focus:border-purple-500/85 focus:outline-none focus:ring-1 focus:ring-purple-500/85 transition duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEnv(idx)}
                          className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition duration-200 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 relative flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:shadow-purple-900/40 hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-purple-200" />
                      <span>Saving Changes...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <Link
                  to="/"
                  className="flex items-center justify-center rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 px-6 text-sm font-semibold text-gray-400 hover:text-white transition duration-200"
                >
                  Cancel
                </Link>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default EditProject;
