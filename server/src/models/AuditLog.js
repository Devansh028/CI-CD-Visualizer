const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    resourceType: {
      type: String,
      required: [true, "Resource type is required"],
      trim: true,
    },
    resourceId: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Add index for fast querying and filtering
auditLogSchema.index({ organizationId: 1, userId: 1, action: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
