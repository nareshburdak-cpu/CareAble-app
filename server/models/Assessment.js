// server/models/Assessment.js

/**
 * Assessment Model
 * ----------------
 * Represents a single user's self-assessment session.
 *
 * States:
 *   - "in-progress"  : User is answering. Can save, resume, edit.
 *   - "submitted"    : Finalized. Scored. Cannot be edited.
 *
 * Answers are stored as a map keyed by questionId (string).
 * Scoring happens on submit — we store categoryScores + overallScore.
 *
 * Scoring (Phase 12-A):
 *   - categoryScores: per-domain mean on 1–5 scale (2dp float)
 *   - overallScore:   mean of domain scores (2dp float, 1–5)
 *   - level:          Support | Growth | Strength  (brief-aligned)
 */

const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["in-progress", "submitted"],
      default: "in-progress",
      index: true,
    },

    // Answers: Map of questionId → answer payload
    //   Likert/Frequency:  { value: "4" }
    //   Multi-select:      { values: ["bathing", "dressing"] }
    answers: {
      type: Map,
      of: new mongoose.Schema(
        {
          value: { type: String },
          values: { type: [String] },
          answeredAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      default: {},
    },

    // Scoring (populated on submit).
    // Values are floats 1.00–5.00, or null for unscoreable categories.
    categoryScores: {
      type: Map,
      of: Number,
      default: {},
    },

    // Locked-in question order for this assessment.
    // Set on first start — ensures the user sees the same shuffled
    // order on resume, and in-progress assessments survive mid-take
    // category archive operations.
    questionOrder: {
      type: Map,
      of: [String],
      default: {},
    },

    categoryOrder: {
      type: [String],
      default: [],
    },

    // Populated on submit only. No default — undefined until submission.
    overallScore: {
      type: Number,
    },

    // Brief-aligned 3-tier levels (Phase 12-A).
    //   Strength  >= 4.0
    //   Growth    >= 3.0
    //   Support   <  3.0
    level: {
      type: String,
      enum: ["Support", "Growth", "Strength"],
    },

    certificateId: {
      type: String,
      unique: true,
      sparse: true,
    },

    submittedAt: {
      type: Date,
    },

    // In-progress drafts expire after the admin-configured window.
    // Cleared on submit so submitted assessments are never TTL-deleted.
    expiresAt: {
      type: Date,
      index: true,
    },

    completionTimeMs: {
      type: Number,
    },
    avgSecPerQuestion: {
      type: Number,
    },
    rushed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

assessmentSchema.methods.getProgress = function (totalQuestions) {
  if (!totalQuestions) return 0;
  return this.answers.size / totalQuestions;
};

// Partial unique index: one in-progress per user maximum.
assessmentSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "in-progress" },
    name: "unique_user_in_progress",
  }
);

// MongoDB TTL cleanup for expired in-progress drafts. expireAfterSeconds: 0
// means the document becomes eligible for deletion once expiresAt is reached.
assessmentSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: "in-progress" },
    name: "in_progress_assessment_expiry",
  }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
