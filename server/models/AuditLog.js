/**
 * AuditLog
 * --------
 * Records every admin action for accountability + forensics.
 *
 * Schema:
 *   - actor: which admin did it
 *   - action: what they did (e.g., "user.promote")
 *   - target: optional reference to the affected resource
 *   - details: arbitrary JSON for context (e.g., before/after values)
 *
 * Auto-deletes after 90 days via TTL index.
 */

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      index: true,
      // Examples:
      //   user.verify, user.unverify, user.promote, user.demote,
      //     user.deactivate, user.reactivate
      //   question.create, question.update, question.archive,
      //     question.restore, question.reorder
      //   category.create, category.update, category.archive,
      //     category.restore, category.reorder
    },

    targetType: {
      type: String,
      enum: ["user", "question", "category", "assessment", null],
      default: null,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Captured for forensics (optional)
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// TTL: auto-delete logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("AuditLog", auditLogSchema);