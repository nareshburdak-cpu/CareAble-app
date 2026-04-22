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
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Trusted, expected error

    // Captures stack trace for debugging (removes constructor from trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;