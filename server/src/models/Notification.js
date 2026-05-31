const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "deployment-success",
        "deployment-failure",
        "rollback-success",
        "rollback-failure",
        "docker-image-redeployed",
        "container-unhealthy",
        "health-check-failure",
        "nginx-proxy-failure",
        "queue-failure",
        "webhook-trigger",
        "high-resource-usage",
        "domain-verified",
      ],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    severity: {
      type: String,
      required: [true, "Notification severity is required"],
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
