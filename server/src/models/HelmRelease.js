const mongoose = require("mongoose");

const helmReleaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Release name is required"],
      trim: true
    },
    clusterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "K8sCluster",
      required: true
    },
    namespace: {
      type: String,
      required: true,
      default: "default"
    },
    chartName: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["deployed", "failed", "superseded", "uninstalled"],
      default: "deployed"
    },
    history: [
      {
        revision: Number,
        updatedAt: { type: Date, default: Date.now },
        status: String,
        description: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound unique key to identify distinct releases per cluster namespace
helmReleaseSchema.index({ name: 1, clusterId: 1, namespace: 1 }, { unique: true });

module.exports = mongoose.model("HelmRelease", helmReleaseSchema);
