const mongoose = require("mongoose");

const iacExecutionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["terraform", "pulumi"]
    },
    operation: {
      type: String,
      required: true,
      enum: ["plan", "apply", "destroy"]
    },
    status: {
      type: String,
      required: true,
      enum: ["running", "success", "failed"],
      default: "running"
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        message: String,
        level: { type: String, default: "info" }
      }
    ],
    configFiles: {
      type: mongoose.Schema.Types.Mixed,
      default: {} // Key-value object mapping file paths to code contents
    },
    stateFile: {
      type: String,
      default: ""
    },
    duration: {
      type: Number,
      default: 0 // Duration in seconds
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("IacExecution", iacExecutionSchema);
