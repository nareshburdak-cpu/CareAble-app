/**
 * requireAdmin
 * ------------
 * Middleware that blocks non-admin users.
 *
 * Must be used AFTER `protect` (which attaches req.user).
 *
 * Usage in routes:
 *   router.get("/users", protect, requireAdmin, getAllUsers);
 */

const ApiError = require("../utils/ApiError");

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    // protect middleware should have caught this, but defense in depth
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role !== "admin") {
    // Don't reveal that an admin endpoint exists
    return next(new ApiError(404, "Resource not found"));
  }

  next();
};

module.exports = requireAdmin;