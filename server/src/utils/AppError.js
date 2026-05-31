/**
 * Custom operational error class for standard API error payloads.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error explanation
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Marks expected API execution failures

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
