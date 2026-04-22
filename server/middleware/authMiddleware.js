/**
 * Auth Middleware
 * ---------------
 * protect:  Verifies JWT token from Authorization header.
 *           On success, attaches req.user (the user document).
 *           On failure, throws 401 Unauthorized.
 *
 * authorize(...roles):  Role-based access control.
 *                       e.g., authorize("admin") rejects non-admins with 403.
 *
 * Usage:
 *   router.get("/me", protect, getMe);
 *   router.delete("/:id", protect, authorize("admin"), deleteUser);
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * protect — requires a valid JWT
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Look for token in "Authorization: Bearer <token>" header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // (Optional) Also accept token from a cookie (useful later for frontend)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. No token? Reject.
  if (!token) {
    throw new ApiError(401, "Not authorized. No token provided");
  }

  // 3. Verify token — throws if invalid/expired (caught by errorHandler)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4. Load user from DB (so we always have the freshest data)
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  // 5. Attach user to request so controllers can use it
  req.user = user;
  next();
});

/**
 * authorize — restrict access by role
 * Use AFTER protect.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role "${req.user.role}" is not authorized for this resource`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize }; 