const mongoose = require("mongoose");

const cloudConnectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Connection alias is required"],
      trim: true
    },
    provider: {
      type: String,
      required: [true, "Cloud provider is required"],
      enum: ["aws", "azure", "gcp", "digitalocean"]
    },
    region: {
      type: String,
      required: [true, "Target region is required"],
      trim: true
    },
    credentials: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Credentials payload is required"]
    },
    status: {
      type: String,
      enum: ["active", "error"],
      default: "active"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("CloudConnection", cloudConnectionSchema);
