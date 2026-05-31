const K8sCluster = require("../models/K8sCluster");
const HelmRelease = require("../models/HelmRelease");
const Project = require("../models/Project");
const k8sService = require("../services/k8sService");
const { checkK8sStatus } = require("../utils/integrationChecker");

// Create cluster connection
const connectCluster = async (req, res) => {
  const { name, type, apiEndpoint } = req.body;

  try {
    const clusterStatus = await checkK8sStatus(apiEndpoint);
    const newCluster = await K8sCluster.create({
      name,
      type,
      apiEndpoint,
      status: clusterStatus.reachable ? "active" : "error",
      owner: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Cluster connected successfully.",
      cluster: newCluster
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Cluster Connection Failed",
      details: error.message
    });
  }
};

// Get all clusters
const getClusters = async (req, res) => {
  try {
    const clusters = await K8sCluster.find({ owner: req.user._id });
    res.json(clusters);
  } catch (error) {
    res.status(500).json({ success: false, error: "Database query failed", details: error.message });
  }
};

// Namespace CRUD
const getNamespaces = async (req, res) => {
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }
    res.json(cluster.namespaces);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const createNamespace = async (req, res) => {
  const { namespace } = req.body;
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }
    if (cluster.namespaces.includes(namespace)) {
      return res.status(400).json({ success: false, error: "Namespace already exists" });
    }
    cluster.namespaces.push(namespace);
    await cluster.save();
    res.json({ success: true, namespaces: cluster.namespaces });
  } catch (error) {
    res.status(500).json({ success: false, error: "Save failed", details: error.message });
  }
};

const deleteNamespace = async (req, res) => {
  const { namespace } = req.params;
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }
    cluster.namespaces = cluster.namespaces.filter(ns => ns !== namespace);
    await cluster.save();
    res.json({ success: true, namespaces: cluster.namespaces });
  } catch (error) {
    res.status(500).json({ success: false, error: "Deletion failed", details: error.message });
  }
};

// Deploy manifests
const deployManifests = async (req, res) => {
  const { projectId, clusterId, namespace, replicas, serviceType, domain } = req.body;
  
  try {
    const project = await Project.findById(projectId);
    const cluster = await K8sCluster.findById(clusterId);
    
    if (!project || !cluster) {
      return res.status(404).json({ success: false, error: "Project or Cluster not found" });
    }

    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }

    // Verify project access
    const isOwner = project.owner.toString() === req.user._id.toString();
    let hasOrgAccess = false;
    if (project.organizationId) {
      const Member = require("../models/Member");
      const member = await Member.findOne({ organizationId: project.organizationId, userId: req.user._id });
      if (member) hasOrgAccess = true;
    }
    if (!isOwner && !hasOrgAccess) {
      return res.status(403).json({ success: false, error: "Access denied. You do not have permissions for this project." });
    }

    const deploymentYaml = k8sService.generateDeploymentYaml(project, project.name.toLowerCase(), "latest", replicas);
    const serviceYaml = k8sService.generateServiceYaml(project, serviceType);
    const ingressYaml = k8sService.generateIngressYaml(project, domain);

    res.json({
      success: true,
      message: "Kubernetes manifests synthesized successfully.",
      manifests: {
        deployment: deploymentYaml,
        service: serviceYaml,
        ingress: ingressYaml
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Manifest generation failed", details: error.message });
  }
};

// Helm Release Management
const getHelmReleases = async (req, res) => {
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }

    const releases = await HelmRelease.find({ clusterId: req.params.clusterId });
    res.json(releases);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const installHelm = async (req, res) => {
  const { releaseName, chartName, version, namespace } = req.body;
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }

    const release = await k8sService.installHelmChart(req.params.clusterId, namespace, releaseName, chartName, version);
    res.status(201).json({ success: true, message: "Helm chart installed", release });
  } catch (error) {
    res.status(500).json({ success: false, error: "Helm Installation failed", details: error.message });
  }
};

const upgradeHelm = async (req, res) => {
  const { version } = req.body;
  const { releaseName, namespace } = req.params;
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }

    const release = await k8sService.upgradeHelmChart(req.params.clusterId, namespace, releaseName, version);
    res.json({ success: true, message: "Helm chart upgraded", release });
  } catch (error) {
    res.status(500).json({ success: false, error: "Helm upgrade failed", details: error.message });
  }
};

const rollbackHelm = async (req, res) => {
  const { revision } = req.body;
  const { releaseName, namespace } = req.params;
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }

    const release = await k8sService.rollbackHelmRelease(req.params.clusterId, namespace, releaseName, revision);
    res.json({ success: true, message: "Helm release rolled back", release });
  } catch (error) {
    res.status(500).json({ success: false, error: "Helm rollback failed", details: error.message });
  }
};

const uninstallHelm = async (req, res) => {
  const { releaseName, namespace } = req.params;
  try {
    const cluster = await K8sCluster.findById(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: "Cluster not found" });
    }
    if (cluster.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this cluster." });
    }

    await HelmRelease.findOneAndDelete({ name: releaseName, clusterId: req.params.clusterId, namespace });
    res.json({ success: true, message: `Helm release '${releaseName}' uninstalled successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, error: "Helm uninstall failed", details: error.message });
  }
};

// Pods & Visualizer API
const getPods = async (req, res) => {
  const { projectName, replicas } = req.query;
  try {
    const pods = k8sService.getMockPods(projectName || "ccv-app", Number(replicas) || 2);
    res.json(pods);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const getPodLogs = async (req, res) => {
  const { podName } = req.params;
  try {
    const timestamp = new Date().toISOString();
    const logs = [
      `[${timestamp}] Starting application server...`,
      `[${timestamp}] Loading database configurations...`,
      `[${timestamp}] MongoDB Connected successfully.`,
      `[${timestamp}] Redis client established on port 6379`,
      `[${timestamp}] Express Web Server running on port 8080`,
      `[${timestamp}] INFO: Ready to process requests.`
    ].join("\n");
    
    res.json({ podName, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const getPodEvents = async (req, res) => {
  const { podName } = req.params;
  try {
    const events = [
      { type: "Normal", reason: "Scheduled", message: `Successfully assigned ${podName} to minikube-node-1` },
      { type: "Normal", reason: "Pulling", message: "Pulling image \"node:20\"" },
      { type: "Normal", reason: "Pulled", message: "Successfully pulled image \"node:20\"" },
      { type: "Normal", reason: "Created", message: "Created container node-app" },
      { type: "Normal", reason: "Started", message: "Started container node-app" }
    ];
    res.json({ podName, events });
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

module.exports = {
  connectCluster,
  getClusters,
  getNamespaces,
  createNamespace,
  deleteNamespace,
  deployManifests,
  getHelmReleases,
  installHelm,
  upgradeHelm,
  rollbackHelm,
  uninstallHelm,
  getPods,
  getPodLogs,
  getPodEvents
};
