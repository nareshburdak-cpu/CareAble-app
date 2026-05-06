// server/models/Question.js

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
 * Categories are validated against the Category collection at save time.
 * The category must exist and be non-archived. This validator runs on
 * .save() and .create(), but NOT on .insertMany() unless runValidators
 * is passed — which is fine because the seed only inserts known-good
 * categories.
 *
 * Note: we do NOT use a static enum (as we did pre-Step 1.4) because
 * categories are dynamic — admins can add/archive them at runtime via
 * /api/admin/categories. A static enum would require an API restart
 * after every category change.
 */

const mongoose = require("mongoose");

const QUESTION_TYPES = ["likert", "frequency", "multi"];

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        // Async validator — confirms the category key exists in the
        // Category collection AND is not archived. Mongoose accepts a
        // Promise-returning validator function.
        validator: async function (value) {
          if (!value) return false;
          // Lazy require to avoid circular imports between Category and
          // Question models (neither depends on the other in practice,
          // but defensive against future refactors).
          const Category = mongoose.model("Category");
          const exists = await Category.exists({
            key: value,
            isArchived: { $ne: true },
          });
          return !!exists;
        },
        message: (props) =>
          `Category '${props.value}' is not a known active capability domain.`,
      },
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
module.exports.QUESTION_TYPES = QUESTION_TYPES;