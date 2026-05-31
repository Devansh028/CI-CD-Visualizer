import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useProjectStore } from "../../store/projectStore";
import { getTemplates, getTemplateById } from "../../api/templateApi";
import { detectFramework } from "../../api/frameworkApi";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Info, 
  Rocket, 
  GitBranch, 
  Settings, 
  Eye, 
  Check, 
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Globe
} from "lucide-react";

const CreateProject = () => {
  const [searchParams] = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);

  // Template lists
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Form Fields
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [template, setTemplateName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [framework, setFramework] = useState("Node.js");
  const [buildCommand, setBuildCommand] = useState("");
  const [startCommand, setStartCommand] = useState("");
  const [dockerStrategy, setDockerStrategy] = useState("node-server");
  const [dockerfilePath, setDockerfilePath] = useState("./Dockerfile");
  const [deployPort, setDeployPort] = useState("3000");
  const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);
  const [autoDeploy, setAutoDeploy] = useState(false);

  // Validation / Loading States
  const [validationError, setValidationError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const { createProject, isLoading, error, clearError } = useProjectStore();

  // Fetch templates list on mount
  useEffect(() => {
    const fetchTemplatesList = async () => {
      try {
        setIsLoadingTemplates(true);
        const list = await getTemplates();
        setTemplates(list);

        // If template ID in query, fetch it and preselect
        if (templateIdParam) {
          const tpl = list.find(t => t._id === templateIdParam) || await getTemplateById(templateIdParam);
          if (tpl) {
            applyTemplate(tpl);
            setStep(2); // Jump to Step 2
          }
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplatesList();
    clearError();
  }, [templateIdParam, clearError]);

  // Apply a template's settings
  const applyTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setTemplateName(tpl.name);
    setFramework(tpl.framework);
    setBuildCommand(tpl.buildCommand || "");
    setStartCommand(tpl.startCommand || "");
    setDockerStrategy(tpl.dockerTemplate);
    setDeployPort(String(tpl.defaultPort));
    
    // Guess a name if empty
    if (!name) {
      setName(tpl.name.toLowerCase().replace(/\s+/g, "-") + "-app");
    }
  };

  const handleSelectTemplate = (tpl) => {
    applyTemplate(tpl);
    setStep(2);
  };

  const handleCustomSetup = () => {
    setSelectedTemplate(null);
    setTemplateName("");
    setFramework("Node.js");
    setBuildCommand("");
    setStartCommand("npm start");
    setDockerStrategy("node-server");
    setDeployPort("3000");
    setStep(2);
  };

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

        const strategyDefaults = {
          "Next.js": "node-server",
          "Node.js": "node-server",
          "Express": "node-server",
          "NestJS": "node-server",
          "Flask": "python-flask",
          "Django": "python-django",
          "FastAPI": "python-fastapi",
          "Spring Boot": "java-springboot",
          "Go": "go-binary",
          "Static Websites": "static-nginx",
          "React": "static-nginx",
          "Vite": "static-nginx"
        };

        const cmdDefaults = {
          "Next.js": { build: "npm install && npm run build", start: "npm start" },
          "Node.js": { build: "npm install", start: "npm start" },
          "Express": { build: "npm install", start: "npm start" },
          "NestJS": { build: "npm install && npm run build", start: "node dist/main" },
          "Flask": { build: "pip install -r requirements.txt", start: "python app.py" },
          "Django": { build: "pip install -r requirements.txt && python manage.py migrate", start: "python manage.py runserver 0.0.0.0:8000" },
          "FastAPI": { build: "pip install -r requirements.txt", start: "uvicorn main:app --host 0.0.0.0 --port 8000" },
          "Spring Boot": { build: "./gradlew build", start: "java -jar build/libs/*.jar" },
          "Go": { build: "go build -o main .", start: "./main" },
          "Static Websites": { build: "", start: "nginx -g \"daemon off;\"" },
          "React": { build: "npm install && npm run build", start: "nginx -g \"daemon off;\"" },
          "Vite": { build: "npm install && npm run build", start: "nginx -g \"daemon off;\"" }
        };

        if (portDefaults[response.framework]) {
          setDeployPort(String(portDefaults[response.framework]));
        }
        if (strategyDefaults[response.framework]) {
          setDockerStrategy(strategyDefaults[response.framework]);
        }
        if (cmdDefaults[response.framework]) {
          setBuildCommand(cmdDefaults[response.framework].build);
          setStartCommand(cmdDefaults[response.framework].start);
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

  const handleAddEnv = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const handleRemoveEnv = (index) => {
    setEnvVars(envVars.filter((_, idx) => idx !== index));
  };

  const handleEnvChange = (index, field, val) => {
    setEnvVars(envVars.map((item, idx) => idx === index ? { ...item, [field]: val } : item));
  };

  // Step Navigations & Validation
  const nextStep = () => {
    if (step === 2) {
      if (!name || !repoUrl || !deployPort) {
        setValidationError("Project Name, GitHub Repo URL, and Deploy Port are required.");
        return;
      }
      const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?\/?$/;
      if (!githubRegex.test(repoUrl)) {
        setValidationError("Please enter a valid GitHub repository URL.");
        return;
      }
      const portNum = Number(deployPort);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        setValidationError("Deploy Port must be between 1 and 65535.");
        return;
      }
    }
    setValidationError("");
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setValidationError("");
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filteredEnvVars = envVars.filter(item => item.key.trim() !== "");
    const portNum = Number(deployPort);

    try {
      setValidationError("");
      await createProject({
        name: name.trim(),
        description: description.trim(),
        repoUrl: repoUrl.trim(),
        branch: branch.trim(),
        framework,
        buildCommand: buildCommand.trim(),
        startCommand: startCommand.trim(),
        dockerStrategy,
        template: template || null,
        dockerfilePath: dockerfilePath.trim(),
        deployPort: portNum,
        environmentVariables: filteredEnvVars,
        autoDeploy,
      });
      navigate("/");
    } catch (err) {
      setValidationError(err.response?.data?.message || "Failed to create project deployment pipeline.");
    }
  };

  // Render step progress header
  const renderStepsHeader = () => {
    const steps = [
      { id: 1, label: "Template", icon: Rocket },
      { id: 2, label: "Repository", icon: GitBranch },
      { id: 3, label: "Env Vars", icon: Settings },
      { id: 4, label: "Launch", icon: Eye }
    ];

    return (
      <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-10 px-4">
        {steps.map((s, index) => {
          const IconComponent = s.icon;
          const isCompleted = step > s.id;
          const isActive = step === s.id;

          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center relative">
                <div 
                  className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted 
                      ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                      : isActive 
                        ? "bg-[#12141c] border-purple-500 text-purple-400 font-bold" 
                        : "bg-[#0e1017]/40 border-white/5 text-gray-500"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <IconComponent className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider mt-2 transition-colors duration-300 ${isActive ? "text-purple-400" : isCompleted ? "text-purple-300" : "text-gray-500"}`}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[1px] flex-1 mx-2 -mt-4 transition-colors duration-500 ${step > s.id ? "bg-purple-600" : "bg-white/5"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07080d] px-4 text-white overflow-hidden py-12">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Back Link */}
        <Link
          to={step === 1 ? "/templates" : "#"}
          onClick={(e) => {
            if (step > 1) {
              e.preventDefault();
              prevStep();
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-purple-400 mb-6 transition duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? "Back to Templates" : `Back to Step ${step - 1}`}
        </Link>

        {/* Header */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl font-extrabold tracking-tight">Project Deployment Wizard</h1>
          <p className="text-xs text-gray-400 font-light mt-1">Deploy services in four simple steps</p>
        </div>

        {/* Step Indicator */}
        {renderStepsHeader()}

        {/* Main Wizard Form Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0e1017]/85 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          
          {/* Validation Alerts */}
          {(error || validationError) && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-400 mb-6">
              {validationError || error}
            </div>
          )}

          {/* STEP 1: CHOOSE TEMPLATE */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Select a Template Preset</h2>
                <p className="text-[11px] text-gray-400">Configure your runtime automatically or configure a custom setup</p>
              </div>

              {isLoadingTemplates ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="h-7 w-7 animate-spin text-purple-500" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Catalog Loading...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                  {templates.map((tpl) => (
                    <div 
                      key={tpl._id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className="border border-white/5 bg-[#12141c]/80 rounded-xl p-4 cursor-pointer hover:border-purple-500/30 hover:bg-[#151822] transition duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-sm text-gray-200">{tpl.name}</h3>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10">
                            {tpl.framework}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-light mb-4">
                          Strategy: <span className="font-medium text-gray-400 capitalize">{tpl.dockerTemplate}</span>, Port: {tpl.defaultPort}
                        </p>
                      </div>
                      <div className="text-[10px] font-semibold text-purple-400 flex items-center gap-1 mt-2">
                        Select Preset <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  ))}

                  {/* Blank Option */}
                  <div 
                    onClick={handleCustomSetup}
                    className="border border-dashed border-white/10 bg-transparent rounded-xl p-4 cursor-pointer hover:border-purple-500/30 hover:bg-[#12141c]/40 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-white">Custom / Blank</h3>
                      <p className="text-[10px] text-gray-500 font-light mt-1">
                        Configure build commands, paths, and Docker strategy completely from scratch.
                      </p>
                    </div>
                    <div className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 mt-4">
                      Select Custom <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: REPOSITORY & BUILD SETTINGS */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Source Repository & Deploy Settings</h2>
                <p className="text-[11px] text-gray-400">
                  {selectedTemplate ? `Configuring with ${selectedTemplate.name} preset` : "Configuring custom deployment settings"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
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
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-200 focus:border-purple-500/80 focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition"
                    placeholder="my-cool-api"
                    required
                  />
                </div>

                {/* Git Repo URL */}
                <div>
                  <label htmlFor="repoUrl" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    GitHub Repo URL *
                  </label>
                  <input
                    id="repoUrl"
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-200 focus:border-purple-500/80 focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition"
                    placeholder="https://github.com/username/repo"
                    required
                  />
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Branch *
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-200 focus:border-purple-500/80 focus:outline-none focus:ring-1 focus:ring-purple-500/80 transition"
                    required
                  />
                </div>

                {/* Framework Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="framework" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Framework *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetect}
                      disabled={isDetecting || !repoUrl}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition duration-200 cursor-pointer"
                    >
                      {isDetecting ? "Detecting..." : "Auto-Detect"}
                    </button>
                  </div>
                  <select
                    id="framework"
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-300 focus:border-purple-500/80 focus:outline-none cursor-pointer"
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

                {/* Port */}
                <div>
                  <label htmlFor="deployPort" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Deploy Port *
                  </label>
                  <input
                    id="deployPort"
                    type="number"
                    value={deployPort}
                    onChange={(e) => setDeployPort(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-200 focus:border-purple-500/80 focus:outline-none"
                    required
                  />
                </div>

                {/* DockerfilePath */}
                <div>
                  <label htmlFor="dockerfilePath" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Dockerfile Path
                  </label>
                  <input
                    id="dockerfilePath"
                    type="text"
                    value={dockerfilePath}
                    onChange={(e) => setDockerfilePath(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-200 focus:border-purple-500/80 focus:outline-none"
                  />
                </div>

              </div>

              {/* Advanced build settings accordion style */}
              <div className="border border-white/5 bg-[#12141c]/40 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Build Command & Strategy Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Build Command */}
                  <div>
                    <label htmlFor="buildCommand" className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Build Command (Run during CI/CD)
                    </label>
                    <input
                      id="buildCommand"
                      type="text"
                      value={buildCommand}
                      onChange={(e) => setBuildCommand(e.target.value)}
                      placeholder="e.g. npm run build"
                      className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/85 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Start Command */}
                  <div>
                    <label htmlFor="startCommand" className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Start Command (Container CMD)
                    </label>
                    <input
                      id="startCommand"
                      type="text"
                      value={startCommand}
                      onChange={(e) => setStartCommand(e.target.value)}
                      placeholder="e.g. npm start"
                      className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/85 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Docker Strategy */}
                <div>
                  <label htmlFor="dockerStrategy" className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Docker Strategy / Base Template
                  </label>
                  <select
                    id="dockerStrategy"
                    value={dockerStrategy}
                    onChange={(e) => setDockerStrategy(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs text-gray-300 focus:border-purple-500/85 focus:outline-none cursor-pointer"
                  >
                    <option value="static-nginx">static-nginx (HTML, React, Vite, Static Sites)</option>
                    <option value="node-server">node-server (Express, NestJS, Next.js, general Node)</option>
                    <option value="python-flask">python-flask (Flask web services)</option>
                    <option value="python-fastapi">python-fastapi (FastAPI applications)</option>
                    <option value="python-django">python-django (Django backend applications)</option>
                    <option value="java-springboot">java-springboot (Spring Boot Gradle/Maven)</option>
                    <option value="go-binary">go-binary (Golang compiled service)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c]/90 py-2.5 px-3 text-sm text-gray-200 focus:border-purple-500/80 focus:outline-none"
                  placeholder="App description..."
                />
              </div>

              {/* Auto Deploy Checkbox */}
              <div className="flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
                <input
                  id="autoDeploy"
                  type="checkbox"
                  checked={autoDeploy}
                  onChange={(e) => setAutoDeploy(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-[#12141c] text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="autoDeploy" className="block text-xs font-bold text-gray-200 cursor-pointer">
                    Enable Auto Deploy (GitHub Webhooks)
                  </label>
                  <p className="text-[10px] text-gray-500 mt-0.5">Triggers rebuilds automatically on branch pushes.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 cursor-pointer transition active:scale-[0.99]"
                >
                  Continue to Env Variables
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ENVIRONMENT VARIABLES */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Inject Environment Variables</h2>
                <p className="text-[11px] text-gray-400">Configure key-value settings to supply secrets or config keys to your server</p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {envVars.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-6 text-center">No variables configured. Click button below to add one.</p>
                ) : (
                  envVars.map((env, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={env.key}
                        onChange={(e) => handleEnvChange(idx, "key", e.target.value)}
                        placeholder="KEY (e.g. DATABASE_URL)"
                        className="flex-1 rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs placeholder-gray-600 text-gray-200 focus:border-purple-500/85 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={env.value}
                        onChange={(e) => handleEnvChange(idx, "value", e.target.value)}
                        placeholder="value"
                        className="flex-1 rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-xs placeholder-gray-600 text-gray-200 focus:border-purple-500/85 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEnv(idx)}
                        className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={handleAddEnv}
                className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 rounded transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Environment Variable
              </button>

              <div className="flex gap-4 border-t border-white/5 pt-6">
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-grow inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 cursor-pointer transition"
                >
                  Review Application Specs
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-sm font-semibold text-gray-400 hover:text-white transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Verify & Launch Deployment</h2>
                <p className="text-[11px] text-gray-400">Review final settings before spinning up the Docker container pipeline</p>
              </div>

              {/* Review summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Repo Spec Panel */}
                <div className="border border-white/5 bg-[#12141c]/40 rounded-xl p-4 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-purple-400 block">Repository Spec</span>
                  <div className="text-xs text-gray-300 font-semibold">{name}</div>
                  <div className="text-[11px] text-gray-500 font-mono truncate">{repoUrl}</div>
                  <div className="text-[11px] text-gray-400">Branch: <span className="font-semibold">{branch}</span></div>
                </div>

                {/* Build Spec Panel */}
                <div className="border border-white/5 bg-[#12141c]/40 rounded-xl p-4 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 block">Environment Config</span>
                  <div className="text-xs text-gray-300">Framework: <span className="font-bold">{framework}</span></div>
                  <div className="text-[11px] text-gray-400">Target Port: <span className="font-mono text-purple-400">{deployPort}</span></div>
                  <div className="text-[11px] text-gray-400">Strategy: <span className="font-medium text-gray-300 capitalize">{dockerStrategy}</span></div>
                </div>

              </div>

              {/* Build Commands Panel */}
              <div className="border border-white/5 bg-[#12141c]/40 rounded-xl p-4 space-y-3">
                <span className="text-[9px] uppercase tracking-wider font-bold text-pink-400 block">Orchestrator Settings</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-gray-500 mr-2">Build Script:</span>
                    <code className="text-gray-300 font-mono bg-white/5 px-1 py-0.5 rounded truncate max-w-[200px] inline-block">{buildCommand || "None (Direct containerization)"}</code>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Run CMD:</span>
                    <code className="text-gray-300 font-mono bg-white/5 px-1 py-0.5 rounded truncate max-w-[200px] inline-block">{startCommand || "Standard Image CMD"}</code>
                  </div>
                </div>
              </div>

              {/* Env Vars Panel */}
              <div className="border border-white/5 bg-[#12141c]/40 rounded-xl p-4 space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 block">Variables ({envVars.filter(e => e.key).length})</span>
                <div className="max-h-24 overflow-y-auto space-y-1.5">
                  {envVars.filter(e => e.key).length === 0 ? (
                    <span className="text-[11px] text-gray-500 italic">No variables defined.</span>
                  ) : (
                    envVars.filter(e => e.key).map((e, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-mono border-b border-white/5 pb-1">
                        <span className="text-purple-400">{e.key}:</span>
                        <span className="text-gray-400 truncate max-w-[220px]">{e.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-grow inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-purple-200" />
                      Launching Pipeline...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Launch Deployment
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 rounded-lg border border-white/5 bg-[#12141c] hover:bg-white/5 text-sm font-semibold text-gray-400 hover:text-white transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CreateProject;
