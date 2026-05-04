/**
 * Audit helpers for admin actions.
 *
 * Usage:
 *   await logAdminAction(req, "user.promote", {
 *     targetType: "user",
 *     targetId: targetUser._id,
 *     details: { from: "user", to: "admin" }
 *   });
 *
 * Failures are logged to console but never throw — auditing
 * shouldn't break the actual operation.
 */

const AuditLog = require("../models/AuditLog");

async function logAdminAction(req, action, options = {}) {
  try {
    await AuditLog.create({
      actor: req.user._id,
      action,
      targetType: options.targetType || null,
      targetId: options.targetId || null,
      details: options.details || {},
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("⚠️  Audit log failed:", err.message);
  }
}

module.exports = { logAdminAction };