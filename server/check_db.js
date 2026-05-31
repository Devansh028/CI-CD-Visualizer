const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cicd_visualizer";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  
  const Deployment = require("./src/models/Deployment");
  const Project = require("./src/models/Project");

  const counts = await Deployment.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  console.log("Deployment status counts:", counts);

  const failedDeps = await Deployment.find({ status: "failed" })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("projectId");
  
  console.log("\nRecent Failed Deployments:\n");
  for (const d of failedDeps) {
    console.log(`ID: ${d._id}`);
    console.log(`Project: ${d.projectId ? d.projectId.name : "null"} (${d.projectId ? d.projectId.status : ""})`);
    console.log(`Stage: ${d.currentStage}`);
    console.log(`Failure message: ${d.failureReason || d.failureMessage || "none"}`);
    console.log(`Logs:`);
    d.logs.slice(-5).forEach(l => console.log(`  [${l.stage}] ${l.message}`));
    console.log("------------------------------------------");
  }

  process.exit(0);
}

run().catch(console.error);
