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
          value: { type: String },          // For likert/frequency
          values: { type: [String] },       // For multi-select
          answeredAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      default: {},
    },

    // Scoring (populated on submit)
    categoryScores: {
      type: Map,
      of: Number,
      default: {},
    },

    // No `default: null` — let it be undefined until submission
    overallScore: {
      type: Number,
    },

    // No `default: null` — let it be undefined until submission
    level: {
      type: String,
      enum: ["Emerging", "Developing", "Confident", "Advanced"],
    },

    // No `default`, no `index: true` — just type + sparse unique
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // No `default: null` — let it be undefined until submission
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Helper: returns the progress as a ratio (0 to 1)
assessmentSchema.methods.getProgress = function (totalQuestions) {
  if (!totalQuestions) return 0;
  return this.answers.size / totalQuestions;
};

// ---- Partial unique index ----
// Enforces: each user can have at most ONE in-progress assessment.
// Submitted assessments are unrestricted.
assessmentSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "in-progress" },
    name: "unique_user_in_progress",
  }
);

module.exports = mongoose.model("Assessment", assessmentSchema);