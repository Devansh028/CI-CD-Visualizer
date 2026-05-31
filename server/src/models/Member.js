const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    role: {
      type: String,
      enum: ["owner", "admin", "developer", "viewer"],
      default: "viewer",
      required: [true, "Role is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate user in the same organization
memberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Member", memberSchema);
