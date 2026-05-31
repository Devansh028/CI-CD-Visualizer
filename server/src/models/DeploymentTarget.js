const mongoose = require("mongoose");

const deploymentTargetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Target name is required"],
      trim: true
    },
    cloudConnectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CloudConnection",
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["ec2", "ecs", "eks", "aks", "app-service", "gke", "compute-engine", "droplets", "k8s"]
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "active"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DeploymentTarget", deploymentTargetSchema);
