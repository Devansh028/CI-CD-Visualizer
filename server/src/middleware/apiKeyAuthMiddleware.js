const ApiKey = require("../models/ApiKey");
const ApiUsage = require("../models/ApiUsage");
const User = require("../models/User");

// Rate limit cache
const rateLimitMap = new Map();

/**
 * Express middleware to authenticate requests via the x-api-key header.
 * Applies a rate limit of 60 requests per minute.
 */
const protectApiKey = async (req, res, next) => {
  const keyHeader = req.headers["x-api-key"] || req.query.api_key;
  if (!keyHeader) {
    return res.status(401).json({ success: false, error: "Authentication Failed", details: "x-api-key header or api_key parameter is missing." });
  }

  try {
    const apiKey = await ApiKey.findOne({ key: keyHeader, status: "active" }).populate("userId");
    if (!apiKey) {
      return res.status(401).json({ success: false, error: "Invalid API Key", details: "The provided API Key is invalid or has been revoked." });
    }

    // Rate Limiting (60 requests per minute)
    const now = Math.floor(Date.now() / 60000); // Current minute
    const limitKey = `${apiKey._id}:${now}`;
    const requestCount = rateLimitMap.get(limitKey) || 0;

    if (requestCount >= 60) {
      return res.status(429).json({
        success: false,
        error: "Rate Limit Exceeded",
        details: "API Key has exceeded the rate limit of 60 requests per minute. Cooldown and try again."
      });
    }

    // Increment request count
    rateLimitMap.set(limitKey, requestCount + 1);

    // Save key usage details
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    // Log API usage analytics in DB
    await ApiUsage.create({
      apiKeyId: apiKey._id,
      endpoint: req.originalUrl.split("?")[0],
      method: req.method,
      statusCode: 200, // Will update on request closure
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Set user properties for downstream middleware
    req.user = apiKey.userId;
    req.apiKey = apiKey;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Security Error", details: error.message });
  }
};

module.exports = {
  protectApiKey
};
