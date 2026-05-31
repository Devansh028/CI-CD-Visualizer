const mongoose = require("mongoose");
const crypto = require("crypto");

const envVarSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, "Environment variable key is required"],
    trim: true,
  },
  value: {
    type: String,
    default: "",
  },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters long"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    repoUrl: {
      type: String,
      required: [true, "GitHub Repository URL is required"],
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?\/?$/,
        "Please provide a valid GitHub repository URL",
      ],
    },
    branch: {
      type: String,
      default: "main",
      trim: true,
    },
    framework: {
      type: String,
      default: "Node.js",
    },
    buildCommand: {
      type: String,
      default: "",
    },
    startCommand: {
      type: String,
      default: "",
    },
    dockerStrategy: {
      type: String,
      default: "",
    },
    dockerfilePath: {
      type: String,
      default: "./Dockerfile",
      trim: true,
    },
    deployPort: {
      type: Number,
      required: [true, "Deploy port is required"],
      min: [1, "Port must be greater than 0"],
      max: [65535, "Port must be less than 65536"],
    },
    environmentVariables: {
      type: [envVarSchema],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
    },
    autoDeploy: {
      type: Boolean,
      default: false,
    },
    webhookSecret: {
      type: String,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    status: {
      type: String,
      enum: ["active", "inactive", "building", "deployed", "failed"],
      default: "active",
    },
    template: {
      type: String,
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-deleteOne hook to clean up related collections
projectSchema.pre("deleteOne", { document: true, query: false }, async function () {
  try {
    const Deployment = mongoose.model("Deployment");
    const EnvironmentVariable = mongoose.model("EnvironmentVariable");
    const Domain = mongoose.model("Domain");
    const Log = mongoose.model("Log");
    const DockerImage = mongoose.model("DockerImage");

    await Deployment.deleteMany({ projectId: this._id });
    await EnvironmentVariable.deleteMany({ projectId: this._id });
    await Domain.deleteMany({ projectId: this._id });
    await Log.deleteMany({ projectId: this._id });
    await DockerImage.deleteMany({ projectId: this._id });
  } catch (err) {
    throw err;
  }
});

module.exports = mongoose.model("Project", projectSchema);

