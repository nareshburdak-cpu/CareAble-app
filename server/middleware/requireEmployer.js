// server/middleware/requireEmployer.js

/**
 * requireEmployer
 * ---------------
 * Blocks users who don't have the "employer" role.
 * Must run after `protect`.
 */

const ApiError = require("../utils/ApiError");

const requireEmployer = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  const roles = req.user.roles || [];
  if (!roles.includes("employer")) {
    return next(new ApiError(403, "Employer access required"));
  }

  next();
};

module.exports = requireEmployer;