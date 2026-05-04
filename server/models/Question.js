/**
 * Question Model
 * --------------
 * Represents a single self-assessment question.
 *
 * Types:
 *   - likert     : 1-5 agreement scale
 *   - frequency  : Never / Rarely / Sometimes / Often / Always
 *   - multi      : Multi-select checkboxes
 *
 * Categories map to the 6 skill areas defined in the project.
 */

const mongoose = require("mongoose");

const CATEGORIES = [
  "personal-care",
  "health-management",
  "emotional-support",
  "household-tasks",
  "navigation-advocacy",
  "self-care-resilience",
];

const QUESTION_TYPES = ["likert", "frequency", "multi"];

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, "Category is required"],
      index: true,
    },
    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: [true, "Question type is required"],
    },
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    helper: {
      type: String,
      trim: true,
      default: "",
    },
    // For "multi" questions only — the list of checkboxes
    options: [
      {
        value: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    // Ordering within a category
    order: {
      type: Number,
      default: 0,
    },
    // Weight for scoring (default 1.0 = equal weight)
    weight: {
      type: Number,
      default: 1,
    },

    // Whether the question is archived (soft-deleted).
  // Archived questions don't appear in new assessments but
  // remain in the DB for historical/audit purposes.
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Track who last modified this question (for audit trail)
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  lastEditedAt: {
    type: Date,
  },
  },
  { timestamps: true }
);

// Compound index for fetching all questions sorted by category + order
questionSchema.index({ category: 1, order: 1 });

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
module.exports.CATEGORIES = CATEGORIES;
module.exports.QUESTION_TYPES = QUESTION_TYPES;