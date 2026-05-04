/**
 * EmailLog
 * --------
 * Tracks every email sent — used for rate limiting.
 *
 * Auto-deletes old logs after 7 days via TTL index.
 */

const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["welcome", "verify-email", "password-reset", "otp"],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index: auto-delete logs after 7 days
emailLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Compound index for fast lookups
emailLogSchema.index({ user: 1, type: 1, sentAt: -1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);