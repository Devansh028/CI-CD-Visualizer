const mongoose = require("mongoose");

const apiUsageSchema = new mongoose.Schema(
  {
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true
    },
    endpoint: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      required: true
    },
    ipAddress: {
      type: String,
      default: ""
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

module.exports = mongoose.model("ApiUsage", apiUsageSchema);
