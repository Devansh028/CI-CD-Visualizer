const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    domain: {
      type: String,
      trim: true,
      default: "",
    },
    subdomain: {
      type: String,
      trim: true,
      default: "",
    },
    targetPort: {
      type: Number,
      required: [true, "Target port is required"],
    },
    containerId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Domain", domainSchema);
