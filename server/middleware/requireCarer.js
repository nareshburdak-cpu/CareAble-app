// server/middleware/requireCarer.js

/**
 * requireCarer
 * ------------
 * Blocks users who don't have the "carer" role.
 * Must run after `protect`.
 */

const ApiError = require("../utils/ApiError");

const requireCarer = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  const roles = req.user.roles || [];
  if (!roles.includes("carer")) {
    return next(new ApiError(403, "Carer access required"));
  }

  next();
};

module.exports = requireCarer;