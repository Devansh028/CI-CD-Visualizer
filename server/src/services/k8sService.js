const fs = require("fs");
const path = require("path");
const K8sCluster = require("../models/K8sCluster");
const HelmRelease = require("../models/HelmRelease");
const logger = require("../utils/logger");

/**
 * Generates the Kubernetes deployment.yaml content for a project.
 */
const generateDeploymentYaml = (project, imageName, tag, replicas = 2) => {
  const name = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const port = project.deployPort || 8080;
  
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: default
  labels:
    app: ${name}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: ${imageName}:${tag}
        ports:
        - containerPort: ${port}
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        env:
        - name: PORT
          value: "${port}"
`;
};

/**
 * Generates the Kubernetes service.yaml content for a project.
 */
const generateServiceYaml = (project, serviceType = "ClusterIP") => {
  const name = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const port = project.deployPort || 8080;
  
  let typeSpec = "";
  if (serviceType !== "ClusterIP") {
    typeSpec = `  type: ${serviceType}\n`;
  }

  return `apiVersion: v1
kind: Service
metadata:
  name: ${name}-service
  namespace: default
  labels:
    app: ${name}
spec:
${typeSpec}  ports:
  - port: 80
    targetPort: ${port}
    protocol: TCP
  selector:
    app: ${name}
`;
};

/**
 * Generates the Kubernetes ingress.yaml content for a project.
 */
const generateIngressYaml = (project, domain) => {
  const name = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const targetDomain = domain || `${name}.localhost`;
  
  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
  - host: ${targetDomain}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${name}-service
            port:
              number: 80
`;
};

/**
 * Simulates a Helm chart installation.
 */
const installHelmChart = async (clusterId, namespace, releaseName, chartName, version) => {
  let release = await HelmRelease.findOne({ name: releaseName, clusterId, namespace });
  if (release) {
    throw new Error(`Helm release '${releaseName}' already exists in namespace '${namespace}'.`);
  }

  release = await HelmRelease.create({
    name: releaseName,
    clusterId,
    namespace,
    chartName,
    version,
    status: "deployed",
    history: [
      {
        revision: 1,
        status: "deployed",
        description: `Install complete: ${chartName}-${version}`
      }
    ]
  });

  return release;
};

/**
 * Simulates a Helm chart upgrade.
 */
const upgradeHelmChart = async (clusterId, namespace, releaseName, version) => {
  const release = await HelmRelease.findOne({ name: releaseName, clusterId, namespace });
  if (!release) {
    throw new Error(`Helm release '${releaseName}' not found.`);
  }

  const nextRevision = release.history.length + 1;
  
  release.version = version;
  release.status = "deployed";
  release.history.push({
    revision: nextRevision,
    status: "deployed",
    description: `Upgrade complete to version ${version}`
  });

  await release.save();
  return release;
};

/**
 * Simulates rolling back a Helm release.
 */
const rollbackHelmRelease = async (clusterId, namespace, releaseName, revision) => {
  const release = await HelmRelease.findOne({ name: releaseName, clusterId, namespace });
  if (!release) {
    throw new Error(`Helm release '${releaseName}' not found.`);
  }

  const revisionRecord = release.history.find(h => h.revision === Number(revision));
  if (!revisionRecord) {
    throw new Error(`Revision ${revision} not found in Helm history.`);
  }

  const nextRevision = release.history.length + 1;
  
  release.status = "deployed";
  release.history.push({
    revision: nextRevision,
    status: "deployed",
    description: `Rollback complete to revision v${revision}`
  });

  await release.save();
  return release;
};

/**
 * Generates an array of mock pod statuses for a deployment to populate the visualizer.
 */
const getMockPods = (projectName, replicas = 2) => {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const statuses = ["Running", "Pending", "CrashLoopBackOff", "Running", "Failed", "Completed"];
  
  const pods = [];
  for (let i = 1; i <= replicas; i++) {
    // Distribute statuses. Pod 1 is usually running, others might pending or crash loop for variety.
    let status = "Running";
    let restarts = 0;
    
    if (i === 2) {
      status = "Running";
    } else if (i === 3) {
      status = "CrashLoopBackOff";
      restarts = 4;
    } else if (i > 3) {
      status = "Pending";
    }

    const podId = `${name}-${Math.random().toString(36).substring(2, 7)}-${i}`;
    pods.push({
      name: podId,
      status,
      restarts,
      age: "2h4m",
      ip: `10.244.0.${10 + i}`,
      node: "minikube-node-1",
      containers: [
        {
          name: name,
          image: `${name}:latest`,
          state: status === "Running" ? "running" : status === "Pending" ? "waiting" : "terminated",
          ready: status === "Running"
        }
      ]
    });
  }

  return pods;
};

module.exports = {
  generateDeploymentYaml,
  generateServiceYaml,
  generateIngressYaml,
  installHelmChart,
  upgradeHelmChart,
  rollbackHelmRelease,
  getMockPods
};
