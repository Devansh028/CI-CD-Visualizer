/**
 * Express middleware helper to trap async promise rejections and forward to next() error handler.
 * 
 * @param {Function} fn - Async controller handler
 * @returns {Function} Express handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
