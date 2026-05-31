/** @file JWT creation helper for authenticated users. */
/**
 * generateToken
 * -------------
 * Creates a signed JSON Web Token for authenticated users.
 *
 * Payload: { id: user._id }
 * Secret: process.env.JWT_SECRET
 * Expiry: process.env.JWT_EXPIRES_IN  (e.g., "7d")
 *
 * Usage:
 *   const token = generateToken(user._id);
 */

const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = generateToken;