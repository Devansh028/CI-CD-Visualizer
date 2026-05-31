const mongoose = require("mongoose");

const tenantBillingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },
    quotas: {
      maxDeployments: { type: Number, default: 5 },
      maxCpu: { type: Number, default: 2 }, // CPU cores
      maxMemory: { type: Number, default: 4 }, // GB RAM
      maxStorage: { type: Number, default: 10 }, // GB Disk Space
      maxBandwidth: { type: Number, default: 50 } // GB Bandwidth
    },
    usage: {
      deployments: { type: Number, default: 0 },
      cpu: { type: Number, default: 0 },
      memory: { type: Number, default: 0 },
      storage: { type: Number, default: 0 },
      bandwidth: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TenantBilling", tenantBillingSchema);
