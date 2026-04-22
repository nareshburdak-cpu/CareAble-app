/**
 * Global Error Handler
 * --------------------
 * Catches all errors forwarded via next(error) and returns a
 * consistent JSON response.
 *
 * Must be the LAST middleware registered in server.js.
 *
 * Response shape:
 *   {
 *     success: false,
 *     message: "...",
 *     stack: "..."   // only in development
 *   }
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // --- Handle specific Mongoose / JWT errors gracefully ---

  // Invalid MongoDB ObjectId (e.g., /users/abc123)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // Duplicate key error (e.g., email already registered)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for "${field}"`;
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // JWT errors (we'll use these in Phase 3)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again";
  }

  // --- Log the error (always in dev; you might pipe to a service in prod) ---
  if (process.env.NODE_ENV !== "production") {
    console.error(`❌ [${req.method}] ${req.originalUrl} -> ${statusCode}: ${message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  // --- Send JSON response ---
  res.status(statusCode).json({
    success: false,
    message,
    // Hide stack trace in production (security)
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;