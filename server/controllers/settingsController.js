// server/controllers/settingsController.js

/**
 * Settings Controller
 * -------------------
 *   GET   /api/admin/settings        — list all settings
 *   PATCH /api/admin/settings/:key   — update one setting
 *
 * All routes are admin-protected.
 *
 * IMPORTANT: Settings only affect NEW assessments. In-progress and
 * submitted assessments keep their locked question set, so admin
 * changes never invalidate existing certificates.
 */

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { getAllSettings, setSetting, SETTING_SCHEMA } = require("../utils/settings");
const { logAdminAction } = require("../utils/audit");
const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const categoryCache = require("../utils/categoryCache");

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @desc    List all platform settings
 * @route   GET /api/admin/settings
 * @access  Admin
 */
const listSettings = asyncHandler(async (req, res) => {
  const settings = await getAllSettings();
  res.status(200).json({
    success: true,
    data: { settings },
  });
});

/**
 * @desc    Update a single setting
 * @route   PATCH /api/admin/settings/:key
 * @access  Admin
 *
 * Body: { value: <number | string | boolean> }
 */
const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (!(key in SETTING_SCHEMA)) {
    throw new ApiError(404, `Unknown setting: ${key}`);
  }
  if (value === undefined) {
    throw new ApiError(400, "`value` is required");
  }

  let newValue;
  try {
    newValue = await setSetting(key, value, req.user._id);
  } catch (err) {
    // Validation errors have statusCode set by the util
    throw new ApiError(err.statusCode || 400, err.message);
  }

  if (key === "inProgressAssessmentExpiryDays") {
    await Assessment.updateMany(
      { status: "in-progress" },
      [
        {
          $set: {
            expiresAt: {
              $add: ["$createdAt", newValue * DAY_MS],
            },
          },
        },
      ],
      { updatePipeline: true }
    );
  }

  await logAdminAction(req, "setting.update", {
    targetType: "setting",
    targetId: key,
    details: { key, value: newValue },
  });

  res.status(200).json({
    success: true,
    message: key === "inProgressAssessmentExpiryDays"
      ? "Setting updated. In-progress assessment expiry times have been refreshed."
      : "Setting updated. Will apply to new assessments going forward.",
    data: { key, value: newValue },
  });
});


/**
 * @desc    Get settings plus computed constraints
 * @route   GET /api/admin/settings/meta
 * @access  Admin
 *
 * Returns current settings + maxAllowed (min question pool
 * across active categories) so the UI can cap the stepper correctly.
 */
const getSettingsMeta = asyncHandler(async (req, res) => {
  const settings = await getAllSettings();

  // Find the smallest question pool across active categories
  const activeCategories = await categoryCache.getCategories();
  const activeKeys = activeCategories.map((c) => c.key);

  // Count non-archived questions per active category
  const counts = await Promise.all(
    activeKeys.map((key) =>
      Question.countDocuments({ category: key, isArchived: { $ne: true } })
    )
  );

  // Min pool = the bottleneck category
  // If no categories or questions exist, fall back to 1
  const maxAllowed = counts.length > 0 ? Math.min(...counts) : 1;

  res.status(200).json({
    success: true,
    data: {
      settings,
      meta: {
        maxAllowed,
        activeCategories: activeKeys.length,
        poolSizes: Object.fromEntries(activeKeys.map((k, i) => [k, counts[i]])),
      },
    },
  });
});

module.exports = {
  listSettings,
  updateSetting,
  getSettingsMeta,
};
