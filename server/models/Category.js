// server/models/Category.js

/**
 * Category Model
 * --------------
 * Represents a capability domain — the top-level grouping for assessment
 * questions. The 12 default domains are seeded from the Capstone Brief
 * Appendix 3, but admins can add/edit/archive domains at runtime via the
 * admin panel (Phase 12-A Step 1.4).
 *
 * Key immutability:
 * The `key` field is the canonical identifier referenced by Question.category
 * and Assessment.categoryScores. It must be unique. Once any non-archived
 * Question references a category by its key — OR any submitted Assessment
 * has scored against it — the key becomes immutable. This prevents
 * orphaning historical data. Enforcement lives in the controller layer.
 *
 * Archive vs delete:
 * Categories are NEVER hard-deleted. Archiving hides them from new
 * assessments but preserves them so old assessments still resolve their
 * categoryScores keys to a real category record.
 */

const mongoose = require("mongoose");

// Allowed colour palettes — must mirror keys in client/src/utils/categoryColors.js.
// Adding a new colour requires updating both files (categoryColors.js needs the
// actual Tailwind classes; admins can't pick a colour at runtime that doesn't
// have CSS to back it).
const ALLOWED_COLORS = [
  "indigo",
  "pink",
  "purple",
  "amber",
  "teal",
  "green",
  "sky",
  "rose",
  "red",
  "violet",
  "fuchsia",
  "blue",
  "orange",
  "emerald",
];

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Key is required"],
      unique: true,
      trim: true,
      lowercase: true,
      // kebab-case validation: lowercase letters, digits, hyphens; no leading/trailing hyphens
      match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, "Key must be kebab-case (e.g., 'leadership-coordination')"],
      maxlength: 80,
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    icon: {
      type: String,
      trim: true,
      default: "",
      maxlength: 8, // single emoji or short symbol
    },
    color: {
      type: String,
      enum: {
        values: ALLOWED_COLORS,
        message: "Color must be one of: " + ALLOWED_COLORS.join(", "),
      },
      default: "indigo",
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
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

// Hot path: list active categories in display order
categorySchema.index({ isArchived: 1, order: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
module.exports.ALLOWED_COLORS = ALLOWED_COLORS;