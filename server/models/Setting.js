// server/models/Setting.js

/**
 * Setting Model
 * -------------
 * Generic key/value store for admin-controlled platform settings.
 *
 * Usage:
 *   await Setting.findOne({ key: "questionsPerCategory" })
 *   await Setting.findOneAndUpdate(
 *     { key: "questionsPerCategory" },
 *     { value: 3, lastEditedBy: req.user._id, lastEditedAt: new Date() },
 *     { upsert: true, new: true }
 *   )
 *
 * Always go through `utils/settings.js` rather than this model
 * directly — it handles caching and defaults.
 */

const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Mixed = supports number, string, boolean, object, array.
    // We validate per-key in the settings utility.
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Human-friendly description shown in the admin UI.
    description: {
      type: String,
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

module.exports = mongoose.model("Setting", settingSchema);