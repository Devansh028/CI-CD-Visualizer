const mongoose = require("mongoose");

const webhookSubscriptionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    url: {
      type: String,
      required: [true, "Webhook delivery URL is required"],
      trim: true
    },
    events: {
      type: [String],
      required: true,
      default: ["deployment.started", "deployment.success", "deployment.failed"]
    },
    secret: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("WebhookSubscription", webhookSubscriptionSchema);
