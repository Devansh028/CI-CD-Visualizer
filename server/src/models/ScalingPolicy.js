const mongoose = require("mongoose");

const scalingPolicySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    metricType: {
      type: String,
      required: true,
      enum: ["cpu", "memory", "request_rate"],
      default: "cpu"
    },
    minReplicas: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    maxReplicas: {
      type: Number,
      required: true,
      default: 5,
      min: 1
    },
    targetThreshold: {
      type: Number,
      required: true,
      default: 70, // percent or request/sec
      min: 1
    },
    cooldownPeriod: {
      type: Number,
      required: true,
      default: 300 // seconds
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ScalingPolicy", scalingPolicySchema);
