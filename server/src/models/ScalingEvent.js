const mongoose = require("mongoose");

const scalingEventSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScalingPolicy",
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ["scale-up", "scale-down"]
    },
    fromReplicas: {
      type: Number,
      required: true
    },
    toReplicas: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model("ScalingEvent", scalingEventSchema);
