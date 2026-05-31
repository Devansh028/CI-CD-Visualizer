import React, { useState, useEffect } from "react";
import ReactFlow, { MiniMap, Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import AppLayout from "../../components/layout/AppLayout";
import { Terminal, ShieldAlert, Cpu, Database, Network, Server, Play, AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";

// Helper to determine pod node styling based on state
const getPodStyle = (status) => {
  switch (status) {
    case "Running":
      return { bg: "bg-emerald-950/80 border-emerald-500/40 text-emerald-400", dot: "bg-emerald-500 animate-pulse" };
    case "CrashLoopBackOff":
      return { bg: "bg-rose-950/80 border-rose-500/40 text-rose-400", dot: "bg-rose-500 animate-ping" };
    case "Pending":
      return { bg: "bg-amber-950/80 border-amber-500/40 text-amber-400", dot: "bg-amber-500 animate-pulse" };
    default:
      return { bg: "bg-slate-900/80 border-slate-700/50 text-slate-400", dot: "bg-slate-500" };
  }
};

const KubernetesVisualizerPage = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeNamespace, setActiveNamespace] = useState("default");
  const [nodeLogs, setNodeLogs] = useState("");
  const [nodeEvents, setNodeEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("logs");
  const [isLoading, setIsLoading] = useState(false);

  // Load cluster visual elements
  const loadTopology = () => {
    setIsLoading(true);
    // Mimics reading active cluster details and namespace tree structure
    setTimeout(() => {
      const mockPods = [
        { name: "ccv-web-deploy-84bf9-p1", status: "Running", restarts: 0, node: "minikube-node-1", ip: "10.244.0.12", age: "2h4m" },
        { name: "ccv-web-deploy-84bf9-p2", status: "Running", restarts: 0, node: "minikube-node-1", ip: "10.244.0.13", age: "2h4m" },
        { name: "ccv-web-deploy-84bf9-p3", status: "CrashLoopBackOff", restarts: 5, node: "minikube-node-2", ip: "10.244.0.14", age: "12m" }
      ];

      // Define visual flow layout coordinates
      const nsNode = {
        id: "ns-1",
        type: "input",
        data: { label: (
          <div className="flex items-center gap-2 p-2">
            <Server className="h-4 w-4 text-purple-400" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Namespace</div>
              <div className="text-xs font-bold text-white">{activeNamespace}</div>
            </div>
          </div>
        )},
        position: { x: 50, y: 150 },
        className: "bg-purple-950/60 border border-purple-500/30 text-white rounded-xl shadow-xl p-0 overflow-hidden w-44"
      };

      const deployNode = {
        id: "dep-1",
        data: { label: (
          <div className="flex items-center gap-2 p-2">
            <Cpu className="h-4 w-4 text-blue-400" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Deployment</div>
              <div className="text-xs font-bold text-white">ccv-web-deploy</div>
            </div>
          </div>
        )},
        position: { x: 280, y: 150 },
        className: "bg-blue-950/60 border border-blue-500/30 text-white rounded-xl shadow-xl p-0 overflow-hidden w-44"
      };

      const rsNode = {
        id: "rs-1",
        data: { label: (
          <div className="flex items-center gap-2 p-2">
            <Database className="h-4 w-4 text-indigo-400" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">ReplicaSet</div>
              <div className="text-xs font-bold text-white">ccv-web-deploy-84bf9</div>
            </div>
          </div>
        )},
        position: { x: 510, y: 150 },
        className: "bg-indigo-950/60 border border-indigo-500/30 text-white rounded-xl shadow-xl p-0 overflow-hidden w-44"
      };

      // Map Pod nodes vertically
      const podNodes = mockPods.map((pod, index) => {
        const { bg, dot } = getPodStyle(pod.status);
        return {
          id: `pod-${index}`,
          data: { label: (
            <div className="p-2.5 flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`}></span>
                <div className="text-left font-mono">
                  <div className="text-[9px] text-gray-400 uppercase font-bold">Pod</div>
                  <div className="text-[10px] font-bold text-white truncate max-w-[120px]">{pod.name}</div>
                </div>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${pod.status === "Running" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                {pod.status}
              </span>
            </div>
          ), podDetails: pod },
          position: { x: 740, y: 50 + index * 90 },
          className: `${bg} border rounded-xl shadow-xl p-0 w-52 cursor-pointer transition hover:scale-102`
        };
      });

      // Map Service Node
      const svcNode = {
        id: "svc-1",
        data: { label: (
          <div className="flex items-center gap-2 p-2">
            <Network className="h-4 w-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase font-mono font-bold">Service (LoadBalancer)</div>
              <div className="text-xs font-bold text-white">ccv-web-service</div>
            </div>
          </div>
        )},
        position: { x: 280, y: 300 },
        className: "bg-emerald-950/60 border border-emerald-500/30 text-white rounded-xl shadow-xl p-0 overflow-hidden w-44"
      };

      setNodes([nsNode, deployNode, rsNode, ...podNodes, svcNode]);

      // Map Edges (connections) with animations
      const flowEdges = [
        { id: "e-ns-dep", source: "ns-1", target: "dep-1", animated: true, style: { stroke: "#a855f7" } },
        { id: "e-dep-rs", source: "dep-1", target: "rs-1", animated: true, style: { stroke: "#3b82f6" } },
        { id: "e-dep-svc", source: "dep-1", target: "svc-1", style: { stroke: "#10b981", strokeDasharray: "5,5" } },
        ...mockPods.map((_, index) => ({
          id: `e-rs-pod-${index}`,
          source: "rs-1",
          target: `pod-${index}`,
          animated: true,
          style: { stroke: "#6366f1" }
        }))
      ];

      setEdges(flowEdges);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadTopology();
  }, [activeNamespace]);

  // Click handler on nodes
  const onNodeClick = (event, node) => {
    if (node.id.startsWith("pod-")) {
      const pod = node.data.podDetails;
      setSelectedNode(pod);
      
      // Load mock logs and events
      setNodeLogs(`[${new Date(Date.now() - 3600000).toISOString()}] Starting application server...
[${new Date(Date.now() - 3500000).toISOString()}] Loading database configurations...
[${new Date(Date.now() - 3400000).toISOString()}] MongoDB Connected successfully.
[${new Date(Date.now() - 3300000).toISOString()}] Redis client established on port 6379
[${new Date(Date.now() - 3200000).toISOString()}] Express Web Server running on port 8080
[${new Date(Date.now() - 3100000).toISOString()}] INFO: Ready to process requests.
[${new Date(Date.now() - 600000).toISOString()}] GET /health 200 OK 5ms
[${new Date().toISOString()}] GET /api/v1/deployments 200 OK 12ms`);
      
      setNodeEvents([
        { type: "Normal", reason: "Scheduled", message: `Successfully assigned ${pod.name} to ${pod.node}`, age: "2h" },
        { type: "Normal", reason: "Pulling", message: "Pulling image \"ccv-app:latest\"", age: "2h" },
        { type: "Normal", reason: "Pulled", message: "Successfully pulled image \"ccv-app:latest\"", age: "2h" },
        { type: "Normal", reason: "Created", message: "Created container ccv-app", age: "2h" },
        { type: "Normal", reason: "Started", message: "Started container ccv-app", age: "2h" },
        pod.status === "CrashLoopBackOff" ? { type: "Warning", reason: "BackOff", message: "Back-off restarting failed container", age: "5m" } : null
      ].filter(Boolean));
    }
  };

  const sidebarInfo = {
    title: "Kubernetes Visualizer",
    description: "Module 50 provides an interactive graph visualization of clusters, deployments, services, namespaces, and pod container logs.",
    status: "Interactive",
    statusColor: "text-indigo-400"
  };

  return (
    <AppLayout sidebarInfo={sidebarInfo}>
      <div className="flex flex-col h-full space-y-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-[#0e1017]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-xl shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Interactive Topology Visualizer</h1>
            <p className="text-[11px] text-gray-400 font-light mt-0.5 font-mono">Observe pods restarts, cluster networking, and container events in real time.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-mono">Namespace:</span>
              <select
                value={activeNamespace}
                onChange={(e) => setActiveNamespace(e.target.value)}
                className="bg-[#07080d] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              >
                <option value="default">default</option>
                <option value="kube-system">kube-system</option>
                <option value="monitoring">monitoring</option>
                <option value="ingress-nginx">ingress-nginx</option>
              </select>
            </div>
            
            <button
              onClick={loadTopology}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Sync Topology
            </button>
          </div>
        </div>

        {/* Visualizer Canvas & Detail Panel */}
        <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-[500px] h-[65vh]">
          {/* React Flow Board */}
          <div className="flex-grow rounded-2xl border border-white/5 bg-[#06070a] overflow-hidden relative shadow-2xl">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2.5">
                  <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
                  <span className="text-xs text-gray-400 font-mono">Loading cluster graph...</span>
                </div>
              </div>
            ) : null}
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={onNodeClick}
              fitView
            >
              <Controls className="bg-slate-900 border border-white/5 text-white" />
              <Background color="#1e293b" gap={16} size={1} />
            </ReactFlow>
            
            <div className="absolute top-4 right-4 bg-[#0e1017]/90 border border-white/5 px-3 py-2 rounded-xl text-[10px] font-mono text-gray-400 space-y-1.5 shadow-xl pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Pod: Running</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Pod: Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span>Pod: CrashLoopBackOff</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Selected Pod Details */}
          {selectedNode ? (
            <div className="w-full lg:w-96 shrink-0 bg-[#0e1017]/40 border border-white/5 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col max-h-full overflow-hidden">
              {/* Node Overview Header */}
              <div className="border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Pod Details</span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-500 hover:text-white text-xs font-mono"
                  >
                    Close [X]
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white font-mono mt-1 break-all">{selectedNode.name}</h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-[10px] font-mono text-gray-400">
                  <div>Status: <span className={selectedNode.status === "Running" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{selectedNode.status}</span></div>
                  <div>Restarts: <span className="text-white">{selectedNode.restarts}</span></div>
                  <div>Node: <span className="text-white">{selectedNode.node}</span></div>
                  <div>IP: <span className="text-white">{selectedNode.ip}</span></div>
                  <div>Age: <span className="text-white">{selectedNode.age}</span></div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5 text-[10px] font-mono mb-3">
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`flex-1 pb-2 border-b text-center font-bold uppercase tracking-wider ${activeTab === "logs" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  Container Logs
                </button>
                <button
                  onClick={() => setActiveTab("events")}
                  className={`flex-1 pb-2 border-b text-center font-bold uppercase tracking-wider ${activeTab === "events" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  Cluster Events
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-grow overflow-y-auto min-h-0">
                {activeTab === "logs" ? (
                  <div className="bg-[#050609] border border-white/5 rounded-xl p-3 font-mono text-[9px] text-gray-300 h-full overflow-auto whitespace-pre leading-relaxed select-text scrollbar-thin">
                    {nodeLogs}
                  </div>
                ) : (
                  <div className="space-y-2 h-full overflow-auto pr-1 scrollbar-thin">
                    {nodeEvents.map((ev, index) => (
                      <div key={index} className="bg-[#050609] border border-white/5 rounded-xl p-2.5 text-[10px] font-mono flex items-start gap-2.5">
                        {ev.type === "Warning" ? (
                          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        ) : (
                          <Play className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${ev.type === "Warning" ? "text-rose-400" : "text-emerald-400"}`}>{ev.reason}</span>
                            <span className="text-[8px] text-gray-600">• {ev.age} ago</span>
                          </div>
                          <p className="text-gray-400 text-[9px] mt-0.5 leading-relaxed">{ev.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-96 shrink-0 bg-[#0e1017]/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 bg-indigo-950/20 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                <Network className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-white">No node selected</h3>
              <p className="text-[10px] text-gray-400 font-light mt-1.5 leading-relaxed max-w-[200px]">
                Click on any pod node in the topology layout to view container logs and live cluster events.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default KubernetesVisualizerPage;
