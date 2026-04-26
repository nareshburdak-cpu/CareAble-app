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
    //
    // We use Map instead of an object so Mongoose can properly track changes.
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

    overallScore: {
      type: Number,
      default: null,
    },

    // Friendly "level" based on overall score (filled on submit)
    level: {
      type: String,
      enum: ["Emerging", "Developing", "Confident", "Advanced", null],
      default: null,
    },

    certificateId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,   // allows multiple null values (while still enforcing uniqueness when set)
      index: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

  },
  { timestamps: true }
);

// Compound index: find user's in-progress assessment fast
assessmentSchema.index({ user: 1, status: 1 });

// Helper: returns the progress as a ratio (0 to 1)
assessmentSchema.methods.getProgress = function (totalQuestions) {
  if (!totalQuestions) return 0;
  return this.answers.size / totalQuestions;
};

// ---- Partial unique index ----
// Enforces: each user can have at most ONE in-progress assessment.
// Submitted assessments are unrestricted (a user can have many).
assessmentSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "in-progress" },
    name: "unique_user_in_progress",
  }
);


module.exports = mongoose.model("Assessment", assessmentSchema);
