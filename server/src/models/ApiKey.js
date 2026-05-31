const mongoose = require("mongoose");
const crypto = require("crypto");

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Key name/alias is required"],
      trim: true
    },
    key: {
      type: String,
      unique: true,
      default: () => "ccv_" + crypto.randomBytes(24).toString("hex")
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ApiKey", apiKeySchema);
