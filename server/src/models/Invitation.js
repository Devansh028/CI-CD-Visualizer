const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["admin", "developer", "viewer"],
      default: "viewer",
      required: [true, "Role is required"],
    },
    token: {
      type: String,
      required: [true, "Invitation token is required"],
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invitation", invitationSchema);
