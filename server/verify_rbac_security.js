const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const http = require("http");

const User = require("./src/models/User");
const Project = require("./src/models/Project");
const Organization = require("./src/models/Organization");
const Member = require("./src/models/Member");
const Deployment = require("./src/models/Deployment");
const K8sCluster = require("./src/models/K8sCluster");
const CloudConnection = require("./src/models/CloudConnection");
const app = require("./src/app");

const PORT = 5057;
let server;

async function run() {
  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cicd_visualizer");
  console.log("Database connected.");

  // Clear existing test entries if they exist
  await User.deleteMany({ email: /@test-rbac\.com$/ });
  await Organization.deleteMany({ name: "RBAC Test Org" });
  
  // Create Test Users
  const users = {};
  const roles = ["owner", "admin", "developer", "viewer"];
  for (const role of roles) {
    users[role] = await User.create({
      name: `RBAC ${role}`,
      email: `${role}@test-rbac.com`,
      password: "password123",
      role: "user" // System wide role is user
    });
  }

  // Global administrator
  users.globalAdmin = await User.create({
    name: "RBAC Global Admin",
    email: "globaladmin@test-rbac.com",
    password: "password123",
    role: "admin" // System wide admin
  });

  // Create Test Organization
  const org = await Organization.create({
    name: "RBAC Test Org",
    slug: "rbac-test-org",
    ownerId: users.owner._id
  });

  // Assign Organization Memberships
  for (const role of roles) {
    await Member.create({
      organizationId: org._id,
      userId: users[role]._id,
      role: role
    });
  }

  // Create Test Project
  const project = await Project.create({
    name: "RBAC Test Project",
    repoUrl: "https://github.com/test/rbac-project",
    deployPort: 3000,
    owner: users.owner._id,
    organizationId: org._id,
    status: "active"
  });

  // Sign JWT Tokens
  const tokens = {};
  for (const key in users) {
    tokens[key] = jwt.sign({ id: users[key]._id }, process.env.JWT_SECRET || "fallback_secret", {
      expiresIn: "1h"
    });
  }

  const { initSocket } = require("./src/websocket/socketServer");
  console.log(`Starting temporary test HTTP server on port ${PORT}`);
  server = http.createServer(app);
  initSocket(server);
  server.listen(PORT);

  // Helper to make request
  const makeRequest = async (method, path, data, tokenKey) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${tokens[tokenKey]}` }
      };
      if (method === "GET") {
        return await axios.get(`http://localhost:${PORT}${path}`, config);
      } else if (method === "POST") {
        return await axios.post(`http://localhost:${PORT}${path}`, data, config);
      } else if (method === "PUT") {
        return await axios.put(`http://localhost:${PORT}${path}`, data, config);
      } else if (method === "DELETE") {
        return await axios.delete(`http://localhost:${PORT}${path}`, config);
      }
    } catch (err) {
      return err.response;
    }
  };

  console.log("\n--- STARTING RBAC SECURITY CHECKS ---");

  // TEST 1: Viewer can read project details but cannot update or delete
  console.log("Asserting Viewer permissions...");
  const viewerGet = await makeRequest("GET", `/api/projects/${project._id}`, null, "viewer");
  if (viewerGet.status !== 200) {
    throw new Error(`Viewer should be able to read project. Got status ${viewerGet.status}`);
  }

  const viewerPut = await makeRequest("PUT", `/api/projects/${project._id}`, { name: "Hacked Project" }, "viewer");
  if (viewerPut.status !== 403) {
    throw new Error(`Viewer should be forbidden from updating project settings. Got status ${viewerPut.status}`);
  }

  const viewerDelete = await makeRequest("DELETE", `/api/projects/${project._id}`, null, "viewer");
  if (viewerDelete.status !== 403) {
    throw new Error(`Viewer should be forbidden from deleting project. Got status ${viewerDelete.status}`);
  }

  // TEST 2: Developer can read, update, trigger deployment, but cannot delete
  console.log("Asserting Developer permissions...");
  const devGet = await makeRequest("GET", `/api/projects/${project._id}`, null, "developer");
  if (devGet.status !== 200) {
    throw new Error(`Developer should be able to read project. Got status ${devGet.status}`);
  }

  const devPut = await makeRequest("PUT", `/api/projects/${project._id}`, { name: "RBAC Project Dev Update", repoUrl: "https://github.com/test/rbac-project", deployPort: 3000 }, "developer");
  if (devPut.status !== 200) {
    throw new Error(`Developer should be allowed to update project settings. Got status ${devPut.status}`);
  }

  const devDeploy = await makeRequest("POST", "/api/deployments/trigger", { projectId: project._id }, "developer");
  // Deployment trigger will call simple-git/Docker checks which might trigger errors or queued. 
  // We just want to make sure it is not blocked by RBAC (should not return 403).
  if (devDeploy.status === 403) {
    throw new Error(`Developer should be authorized to trigger deployment. Got status ${devDeploy.status}`);
  }

  const devDelete = await makeRequest("DELETE", `/api/projects/${project._id}`, null, "developer");
  if (devDelete.status !== 403) {
    throw new Error(`Developer should be forbidden from deleting project. Got status ${devDelete.status}`);
  }

  // TEST 3: Admin & Owner can do everything
  console.log("Asserting Admin/Owner permissions...");
  const adminPut = await makeRequest("PUT", `/api/projects/${project._id}`, { name: "RBAC Project Admin Update", repoUrl: "https://github.com/test/rbac-project", deployPort: 3000 }, "admin");
  if (adminPut.status !== 200) {
    throw new Error(`Admin should be allowed to update project. Got status ${adminPut.status}`);
  }

  // TEST 4: Environment secrets protection
  console.log("Asserting Secrets Access permissions...");
  const viewerEnv = await makeRequest("GET", `/api/projects/${project._id}/env`, null, "viewer");
  if (viewerEnv.status !== 200) {
    throw new Error(`Viewer should be allowed to read environment variables list. Got status ${viewerEnv.status}`);
  }

  const viewerAddEnv = await makeRequest("POST", `/api/projects/${project._id}/env`, { key: "SECRET_KEY", value: "secret", isSecret: true }, "viewer");
  if (viewerAddEnv.status !== 403) {
    throw new Error(`Viewer should be forbidden from adding environment variables. Got status ${viewerAddEnv.status}`);
  }

  const devAddEnv = await makeRequest("POST", `/api/projects/${project._id}/env`, { key: "DEV_KEY", value: "dev_val", isSecret: false }, "developer");
  if (devAddEnv.status !== 201) {
    throw new Error(`Developer should be allowed to add environment variables. Got status ${devAddEnv.status}`);
  }

  // TEST 5: Global SaaS admin analytics endpoint
  console.log("Asserting SaaS Admin privileges...");
  const ownerSaaS = await makeRequest("GET", "/api/saas/admin/analytics", null, "owner");
  if (ownerSaaS.status !== 403) {
    throw new Error(`Standard organization owner should be blocked from global SaaS analytics. Got status ${ownerSaaS.status}`);
  }

  const globalAdminSaaS = await makeRequest("GET", "/api/saas/admin/analytics", null, "globalAdmin");
  if (globalAdminSaaS.status !== 200) {
    throw new Error(`Global system administrator should be allowed to access SaaS analytics. Got status ${globalAdminSaaS.status}`);
  }

  // TEST 6: Audit Logs access scope
  console.log("Asserting Audit Logs multi-tenant boundaries...");
  const fakeOrgId = new mongoose.Types.ObjectId();
  const logsQuery = await makeRequest("GET", `/api/audit?organizationId=${fakeOrgId}`, null, "developer");
  if (logsQuery.status !== 403) {
    throw new Error(`Developer should be forbidden from querying audit logs of an organization they don't belong to. Got status ${logsQuery.status}`);
  }

  // TEST 7: Project delete cascade verification
  console.log("Asserting cascade deletions on Project deletion...");
  // Create mock deployment record for cascade verification
  await Deployment.create({
    projectId: project._id,
    commitHash: "cascade-test-hash",
    branch: "master",
    triggerType: "manual",
    status: "queued"
  });

  const ownerDelete = await makeRequest("DELETE", `/api/projects/${project._id}`, null, "owner");
  if (ownerDelete.status !== 200) {
    throw new Error(`Owner should be allowed to delete project. Got status ${ownerDelete.status}`);
  }

  // Assert cascade deletion completed
  const remainingDeployments = await Deployment.countDocuments({ projectId: project._id });
  if (remainingDeployments !== 0) {
    throw new Error(`Cascade deletion failed! Remaining deployments count: ${remainingDeployments}`);
  }
  console.log("Project and all associated database records cleaned up successfully.");

  console.log("\n--- ALL RBAC & SECURITY AUDIT CHECKS PASSED SUCCESSFULLY! ---");
  cleanup();
}

function cleanup() {
  if (server) {
    server.close();
  }
  mongoose.disconnect();
}

run().catch(err => {
  console.error("Test suite failed:", err);
  cleanup();
  process.exit(1);
});
