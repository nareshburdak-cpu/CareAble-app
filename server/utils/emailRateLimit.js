/**
 * Email Rate Limiter
 * ------------------
 * Two limits:
 *   1. Per-type cooldown: minimum seconds between same-type emails
 *   2. Daily total cap: max emails per user per 24h
 *
 * Throws ApiError(429) when limits exceeded.
 *
 * Usage:
 *   await checkEmailRateLimit(userId, "verify-email");
 *   await sendEmail(...);
 *   await logEmailSent(userId, "verify-email");
 */

const EmailLog = require("../models/EmailLog");
const ApiError = require("./ApiError");

// Per-type cooldowns (in seconds)
const COOLDOWNS = {
  "welcome": 0,
  "verify-email": 60,
  "password-reset": 60,
  "login-otp": 60,
  "otp": 30,
};

// Global daily cap per user (across all types)
const DAILY_CAP = 10;

/**
 * Throws ApiError(429) if user is rate-limited.
 */
async function checkEmailRateLimit(userId, type) {
  const cooldownSec = COOLDOWNS[type] ?? 60;

  // Check 1: Per-type cooldown
  if (cooldownSec > 0) {
    const cutoff = new Date(Date.now() - cooldownSec * 1000);
    const recent = await EmailLog.findOne({
      user: userId,
      type,
      sentAt: { $gte: cutoff },
    }).sort({ sentAt: -1 });

    if (recent) {
      const secondsRemaining = Math.ceil(
        (cooldownSec * 1000 - (Date.now() - recent.sentAt.getTime())) / 1000
      );
      throw new ApiError(
        429,
        `Please wait ${secondsRemaining}s before requesting another email.`,
        { rateLimit: { type, secondsRemaining } }
      );
    }
  }

  // Check 2: Daily cap (across all email types)
  const dayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayCount = await EmailLog.countDocuments({
    user: userId,
    sentAt: { $gte: dayCutoff },
  });

  if (todayCount >= DAILY_CAP) {
    throw new ApiError(
      429,
      "You've reached the daily limit for emails from us. Please try again tomorrow.",
      { rateLimit: { dailyCap: DAILY_CAP, count: todayCount } }
    );
  }
}

/**
 * Log a successful email send. Call AFTER sendEmail succeeds.
 */
async function logEmailSent(userId, type) {
  try {
    await EmailLog.create({ user: userId, type });
  } catch (err) {
    // Log failure shouldn't break email — just warn
    console.error("Failed to log email:", err.message);
  }
}

module.exports = {
  checkEmailRateLimit,
  logEmailSent,
  COOLDOWNS,
  DAILY_CAP,
};
