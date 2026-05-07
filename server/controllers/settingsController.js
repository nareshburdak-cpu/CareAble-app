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

  await logAdminAction(req, "setting.update", {
    targetType: "setting",
    targetId: key,
    details: { key, value: newValue },
  });

  res.status(200).json({
    success: true,
    message: "Setting updated. Will apply to new assessments going forward.",
    data: { key, value: newValue },
  });
});

module.exports = {
  listSettings,
  updateSetting,
};