const mongoose = require("mongoose");

const logLineSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  message: {
    type: String,
    required: true,
  },
  stage: {
    type: String,
    required: true,
  },
}, { _id: false });

const deploymentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    commitHash: {
      type: String,
      required: [true, "Commit hash is required"],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    triggerType: {
      type: String,
      enum: ["manual", "webhook"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed", "rolled-back", "cloning", "building", "dockerizing", "deploying", "running"],
      default: "queued",
    },
    currentStage: {
      type: String,
      enum: [
        "queued",
        "code-fetch",
        "dependency-install",
        "build",
        "docker-build",
        "container-start",
        "reverse-proxy-setup",
        "deploy",
        "health-check",
        "success",
        "failed",
        "rollback-init",
        "container-stop",
        "previous-image-load",
        "proxy-rebind",
        "cloning",
        "building",
        "dockerizing",
        "deploying",
        "running"
      ],
      default: "queued",
    },
    framework: {
      type: String,
      default: "",
    },
    cloneTime: {
      type: Number,
      default: 0,
    },
    cloneDuration: {
      type: Number,
      default: 0,
    },
    buildTime: {
      type: Number,
      default: 0,
    },
    deployTime: {
      type: Number,
      default: 0,
    },
    repoUrl: {
      type: String,
      default: "",
    },
    containerId: {
      type: String,
      trim: true,
    },
    containerPort: {
      type: Number,
    },
    containerStatus: {
      type: String,
      trim: true,
    },
    dockerImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DockerImage",
    },
    logs: {
      type: [logLineSchema],
      default: [],
    },
    pusher: {
      type: String,
      default: "System",
    },
    commitMessage: {
      type: String,
      default: "",
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0, // Duration in seconds
    },
    imageTag: {
      type: String,
      trim: true,
    },
    deployedDomain: {
      type: String,
      trim: true,
    },
    deploymentVersion: {
      type: String,
      trim: true,
    },
    rollbackAvailable: {
      type: Boolean,
      default: false,
    },
    failureReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to auto-calculate the deployment version
deploymentSchema.pre("save", async function () {
  if (this.isNew && !this.deploymentVersion) {
    const count = await this.constructor.countDocuments({ projectId: this.projectId });
    this.deploymentVersion = `v${count + 1}`;
  }
});

module.exports = mongoose.model("Deployment", deploymentSchema);
