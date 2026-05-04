/**
 * ApiError
 * --------
 * Custom error class for API errors.
 * Extends the built-in Error class and adds:
 *   - statusCode (e.g., 404, 400, 500)
 *   - isOperational flag (to distinguish expected vs. unexpected errors)
 *
 * Usage:
 *   throw new ApiError(404, "User not found");
 */

class ApiError extends Error {
  constructor(statusCode, message, extra = null) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;   // ← optional metadata (e.g., cooldown info)
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;