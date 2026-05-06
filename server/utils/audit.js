// server/utils/audit.js

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
 * Failures are logged loudly to console but never throw — auditing
 * shouldn't break the actual operation. Returns a result object so
 * callers CAN check success if they want, but most don't need to.
 *
 * Loud failure logging includes the action, actor ID, and full stack
 * trace, prefixed with [AUDIT FAILURE] for easy grepping in Render logs.
 *
 * Failure counter: bumps an in-memory counter on each failure.
 * Reset on process restart. Read-only access via getFailureStats().
 * If audit failures become frequent in production, expose this via
 * the analytics endpoint to alert.
 */

const AuditLog = require("../models/AuditLog");

// In-memory failure counter — process-local. Never persisted.
let failureCount = 0;
let lastFailure = null;

async function logAdminAction(req, action, options = {}) {
  // Defensive: ensure we have an actor before attempting to write.
  // Without an actor the audit row is meaningless, so bail loudly.
  if (!req?.user?._id) {
    failureCount++;
    lastFailure = { at: new Date(), action, reason: "missing_actor" };
    console.error(
      `[AUDIT FAILURE] action="${action}" — no req.user._id. Audit row not written.`
    );
    return { ok: false, error: "missing_actor" };
  }

  try {
    await AuditLog.create({
      actor: req.user._id,
      action,
      targetType: options.targetType || null,
      targetId: options.targetId || null,
      details: options.details || {},
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
    });
    return { ok: true };
  } catch (err) {
    failureCount++;
    lastFailure = {
      at: new Date(),
      action,
      reason: err.name || "unknown",
      message: err.message,
    };
    // Loud failure log — full stack, all the context you'd need to debug.
    // Grep "[AUDIT FAILURE]" in Render logs to find these.
    console.error(
      `[AUDIT FAILURE] action="${action}" actor=${req.user._id} target=${options.targetType}:${options.targetId}`
    );
    console.error(err);
    return { ok: false, error: err.message };
  }
}

/**
 * Process-local failure stats. Useful for debugging or future alerting.
 * @returns {{ count: number, lastFailure: Object|null }}
 */
function getFailureStats() {
  return { count: failureCount, lastFailure };
}

module.exports = { logAdminAction, getFailureStats };