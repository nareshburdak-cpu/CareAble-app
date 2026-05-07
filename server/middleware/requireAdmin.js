// server/middleware/requireAdmin.js

/**
 * requireAdmin
 * ------------
 * Blocks non-admin users. Must run after `protect`.
 * Checks roles array (Phase 12-A multi-role).
 * Returns 404 to hide admin endpoint existence from non-admins.
 */

const ApiError = require("../utils/ApiError");

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  const roles = req.user.roles || [];
  if (!roles.includes("admin")) {
    return next(new ApiError(404, "Resource not found"));
  }

  next();
};

module.exports = requireAdmin;