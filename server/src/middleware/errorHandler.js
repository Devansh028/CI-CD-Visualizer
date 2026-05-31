const logger = require("../utils/logger");

/**
 * Express error response formatter and boundary.
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // 1. Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid field: ${err.path}`;
    error = { message, statusCode: 400, status: "fail" };
  }

  // 2. Handle MongoDB Duplicate Key (11000)
  if (err.code === 11000) {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : "value";
    const message = `Duplicate value error: ${value} already exists. Please use another value.`;
    error = { message, statusCode: 400, status: "fail" };
  }

  // 3. Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Validation failed: ${errors.join(". ")}`;
    error = { message, statusCode: 400, status: "fail" };
  }

  // 4. Handle JSON Web Token Errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid auth token. Access denied.";
    error = { message, statusCode: 401, status: "fail" };
  }

  // 5. Handle JSON Web Token Expiration
  if (err.name === "TokenExpiredError") {
    const message = "Session expired. Please log in again.";
    error = { message, statusCode: 401, status: "fail" };
  }

  // Define response fields
  const statusCode = error.statusCode || err.statusCode || 500;
  const response = {
    success: false,
    message: error.message || "Internal Server Error",
    details: error.details || err.message || null,
  };

  // Stack trace is only exposed in development mode
  if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
    response.stack = error.stack;
  }

  // Logs severity depending on error status
  if (statusCode >= 500) {
    logger.error(`[Express Error Boundary] URL=${req.originalUrl} | Error=${err.message}`, {
      stack: err.stack
    });
  } else {
    logger.warn(`[Express Client Failure] URL=${req.originalUrl} | Message=${error.message}`);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
