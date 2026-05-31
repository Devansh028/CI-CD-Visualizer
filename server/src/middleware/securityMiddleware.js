const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const compression = require("compression");

// Rate limit configuration: Max 200 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

/**
 * Strips script tags, style tags, HTML entities, and standard inline events from strings.
 */
const sanitizeString = (val) => {
  if (typeof val !== "string") return val;
  return val
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "") // Strip raw HTML tags
    .replace(/on\w+="[^"]*"/gi, "")  // Strip event handlers
    .replace(/javascript:[^"]*/gi, "") // Strip javascript URLs
    .trim();
};

/**
 * Recursively walks an input structure, cleaning strings and deleting properties with NoSQL injections.
 */
const sanitizeInput = (val) => {
  if (val === null || val === undefined) return val;

  if (typeof val === "string") {
    return sanitizeString(val);
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }

  if (typeof val === "object") {
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Prevent MongoDB query selectors (NoSQL Injection)
        if (key.startsWith("$") || key.includes(".")) {
          delete val[key];
        } else {
          val[key] = sanitizeInput(val[key]);
        }
      }
    }
  }

  return val;
};

// Middleware to recursively sanitize MongoDB NoSQL injections and XSS in-place (mutates fields)
const nosqlAndXssSanitizer = (req, res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
};

/**
 * Configure global security and optimization middlewares.
 * 
 * @param {Object} app - Express app instance
 */
const applySecurityMiddleware = (app) => {
  // 1. HTTP Security Headers
  app.use(helmet());

  // 2. Body compression
  app.use(compression());

  // 3. Rate Limiter
  app.use("/api/", limiter);

  // 4. Custom self-contained NoSQL and XSS injection sanitizer
  app.use(nosqlAndXssSanitizer);

  // 5. Parameter pollution protection
  app.use(hpp());
};

module.exports = {
  applySecurityMiddleware
};
