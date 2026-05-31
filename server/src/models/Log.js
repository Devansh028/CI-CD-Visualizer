const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    deploymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
      required: [true, "Deployment reference is required"],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    stage: {
      type: String,
      required: [true, "Stage name is required"],
    },
    message: {
      type: String,
      required: [true, "Log message is required"],
    },
    level: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("Log", logSchema);
