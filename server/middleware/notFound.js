/**
 * notFound Middleware
 * -------------------
 * Catches requests to undefined routes and forwards a 404 error
 * to the global error handler.
 *
 * Must be placed AFTER all routes in server.js.
 */

const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;