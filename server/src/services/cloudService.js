const CloudConnection = require("../models/CloudConnection");
const DeploymentTarget = require("../models/DeploymentTarget");

/**
 * Returns mock cloud cost tracking statistics for a specific organization or cloud connection.
 */
const getCloudCostStats = (provider) => {
  const providers = {
    aws: { monthlyTotal: 654.20, compute: 412.00, storage: 154.20, network: 88.00 },
    azure: { monthlyTotal: 490.80, compute: 298.00, storage: 122.80, network: 70.00 },
    gcp: { monthlyTotal: 580.45, compute: 360.00, storage: 140.45, network: 80.00 },
    digitalocean: { monthlyTotal: 145.00, compute: 95.00, storage: 30.00, network: 20.00 }
  };

  const selected = providers[provider.toLowerCase()] || providers.aws;
  
  // Generate daily costs for the last 7 days
  const dailyCosts = [];
  const base = selected.monthlyTotal / 30;
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    // Add small random noise to make the chart look alive
    const cost = Number((base + (Math.random() - 0.5) * (base * 0.15)).toFixed(2));
    dailyCosts.push({ label, cost });
  }

  return {
    ...selected,
    dailyCosts
  };
};

/**
 * Returns mock resource inventory for visualizer and list components.
 */
const getCloudResourceExplorer = (provider) => {
  const inventories = {
    aws: [
      { name: "ccv-production-eks", type: "Elastic Kubernetes Service (EKS)", status: "healthy", location: "us-east-1", details: "Cluster Version: 1.28 | Nodes: 3" },
      { name: "ccv-db-replica-1", type: "EC2 Instance", status: "healthy", location: "us-east-1", details: "Instance Type: t3.medium | IP: 54.210.12.8" },
      { name: "ccv-assets-bucket", type: "Simple Storage Service (S3)", status: "healthy", location: "global", details: "Storage Size: 42.8 GB | Objects: 14K" }
    ],
    azure: [
      { name: "ccv-production-aks", type: "Azure Kubernetes Service (AKS)", status: "healthy", location: "eastus", details: "Kubernetes Version: 1.28.3 | Nodes: 2" },
      { name: "ccv-web-app-service", type: "App Service", status: "healthy", location: "eastus", details: "Plan: Premium V3 | URL: ccv-web.azurewebsites.net" }
    ],
    gcp: [
      { name: "ccv-production-gke", type: "Google Kubernetes Engine (GKE)", status: "healthy", location: "us-central1-a", details: "Release channel: Regular | Nodes: 4" },
      { name: "ccv-api-gateway", type: "Compute Engine (VM)", status: "healthy", location: "us-central1-b", details: "Machine Type: e2-medium | IP: 35.224.19.4" }
    ],
    digitalocean: [
      { name: "ccv-droplet-api", type: "Droplet (VM)", status: "healthy", location: "nyc3", details: "Size: 2GB / 1 vCPU | IP: 159.203.4.12" },
      { name: "ccv-k8s-cluster", type: "DigitalOcean Kubernetes (DOKS)", status: "healthy", location: "nyc3", details: "Nodes: 2 | IP: 159.203.5.99" }
    ]
  };

  return inventories[provider.toLowerCase()] || inventories.aws;
};

module.exports = {
  getCloudCostStats,
  getCloudResourceExplorer
};
