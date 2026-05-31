const axios = require("axios");
const crypto = require("crypto");
const WebhookSubscription = require("../models/WebhookSubscription");
const logger = require("../utils/logger");

/**
 * Dispatches a webhook notification to all active subscribers of an event.
 * Computes a cryptographically secure signature matching standard webhooks formats.
 * 
 * @param {string} projectId - Project identifier
 * @param {string} eventName - Name of the event topic (e.g. deployment.success)
 * @param {Object} payload - Data payload to transmit
 */
const dispatchWebhook = async (projectId, eventName, payload) => {
  try {
    const subscriptions = await WebhookSubscription.find({
      projectId,
      events: eventName,
      active: true
    });

    if (subscriptions.length === 0) return;

    logger.info(`[Webhook] Dispatching '${eventName}' webhook for project ${projectId} to ${subscriptions.length} subscribers...`);

    const promises = subscriptions.map(async (sub) => {
      const body = JSON.stringify({
        event: eventName,
        timestamp: new Date(),
        data: payload
      });

      // Sign payload with subscription secret using SHA256 HMAC
      const signature = crypto
        .createHmac("sha256", sub.secret)
        .update(body)
        .digest("hex");

      try {
        await axios.post(sub.url, body, {
          headers: {
            "Content-Type": "application/json",
            "x-ccv-signature": signature,
            "x-ccv-event": eventName
          },
          timeout: 4000
        });
        logger.info(`[Webhook] Successfully delivered '${eventName}' to: ${sub.url}`);
      } catch (err) {
        logger.error(`[Webhook] Delivery failed to '${sub.url}': ${err.message}`);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    logger.error(`[Webhook] Webhook dispatcher encountered an error: ${error.message}`);
  }
};

module.exports = {
  dispatchWebhook
};
