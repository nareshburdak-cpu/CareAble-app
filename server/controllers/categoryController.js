// server/controllers/categoryController.js

/**
 * Category Controller
 * -------------------
 * Admin endpoints for managing capability domains (categories).
 *
 * All routes are protected by requireAdmin via adminRoutes.
 *
 * The 12 default categories from the Capstone Brief are seeded via
 * server/seed/categories.seed.js. Beyond that, admins can add new
 * domains, edit existing ones, archive/restore, and reorder.
 *
 * Key immutability rule:
 * Once a category's `key` is referenced by ANY non-archived question OR
 * by ANY assessment's categoryScores, the key becomes immutable.
 * Display fields (label, description, icon, color, order) remain editable.
 */

const Category = require("../models/Category");
const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const categoryCache = require("../utils/categoryCache");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { logAdminAction } = require("../utils/audit");
const { ALLOWED_COLORS } = require("../models/Category");

// ----- Helpers ----------------------------------------------------------

/**
 * Convert a label into a kebab-case key.
 * "My Domain (2024)!" -> "my-domain-2024"
 */
const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .normalize("NFKD")              // strip accents
    .replace(/[\u0300-\u036f]/g, "") // remove combining marks
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "")         // trim leading/trailing hyphens
    .slice(0, 80);                    // schema maxlength

/**
 * Check whether a category key is "in use" — referenced by at least one
 * non-archived question OR by at least one assessment's categoryScores.
 *
 * Returns { inUse: boolean, questionCount, assessmentCount } so callers
 * can produce informative error messages.
 */
const checkKeyInUse = async (key) => {
  const [questionCount, assessmentCount] = await Promise.all([
    Question.countDocuments({ category: key, isArchived: { $ne: true } }),
    // Mongoose Map dot-path lookup — checks if the key exists in the Map
    Assessment.countDocuments({ [`categoryScores.${key}`]: { $exists: true } }),
  ]);
  return {
    inUse: questionCount > 0 || assessmentCount > 0,
    questionCount,
    assessmentCount,
  };
};

// ----- Endpoints --------------------------------------------------------

/**
 * @desc    List all categories (including archived)
 * @route   GET /api/admin/categories
 * @access  Admin
 */
const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryCache.getAllCategoriesIncludingArchived();

  // Enrich with question counts so the admin UI can show
  // "5 active / 1 archived" per category at a glance.
  const counts = await Question.aggregate([
    {
      $group: {
        _id: { category: "$category", archived: { $ifNull: ["$isArchived", false] } },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build a map: { [categoryKey]: { active, archived } }
  const countMap = {};
  for (const row of counts) {
    const cat = row._id.category;
    if (!countMap[cat]) countMap[cat] = { active: 0, archived: 0 };
    if (row._id.archived) countMap[cat].archived += row.count;
    else countMap[cat].active += row.count;
  }

  const enriched = categories.map((c) => ({
    ...c,
    questionCount: countMap[c.key]?.active || 0,
    archivedQuestionCount: countMap[c.key]?.archived || 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      categories: enriched,
      total: enriched.length,
      activeCount: enriched.filter((c) => !c.isArchived).length,
      archivedCount: enriched.filter((c) => c.isArchived).length,
      allowedColors: ALLOWED_COLORS,
    },
  });
});

/**
 * @desc    Create a new category
 * @route   POST /api/admin/categories
 * @access  Admin
 *
 * Body:
 *   - label (required)
 *   - description (optional)
 *   - icon (optional)
 *   - color (optional, defaults to 'indigo')
 *   - key (optional — auto-generated from label if omitted)
 */
const createCategory = asyncHandler(async (req, res) => {
  const { label, description, icon, color, key: providedKey } = req.body;

  if (!label || typeof label !== "string" || !label.trim()) {
    throw new ApiError(400, "Label is required");
  }

  // Derive or validate the key
  const key = (providedKey && providedKey.trim())
    ? providedKey.trim().toLowerCase()
    : slugify(label);

  if (!key) {
    throw new ApiError(400, "Could not derive a key from the label. Provide one manually.");
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) {
    throw new ApiError(400, "Key must be kebab-case (lowercase letters, digits, hyphens; no leading/trailing hyphens)");
  }

  // Collision check (includes archived — can't reuse an archived key
  // because old assessments still reference it)
  const existing = await Category.findOne({ key }).lean();
  if (existing) {
    throw new ApiError(
      409,
      existing.isArchived
        ? `Key '${key}' is already used by an archived category. Pick a different key or restore the archived one.`
        : `Key '${key}' already exists.`
    );
  }

  // Determine the next order — append to the end of the active list
  const lastOrder = await Category.findOne()
    .sort({ order: -1 })
    .select("order")
    .lean();
  const order = lastOrder ? (lastOrder.order || 0) + 1 : 0;

  const category = await Category.create({
    key,
    label: label.trim(),
    description: description?.trim() || "",
    icon: icon?.trim() || "",
    color: color || "indigo",
    order,
    lastEditedBy: req.user._id,
    lastEditedAt: new Date(),
  });

  categoryCache.invalidate();

  await logAdminAction(req, "category.create", {
    targetType: "category",
    targetId: category._id,
    details: { key: category.key, label: category.label },
  });

  res.status(201).json({
    success: true,
    message: "Category created.",
    data: { category },
  });
});

/**
 * @desc    Update a category
 * @route   PATCH /api/admin/categories/:id
 * @access  Admin
 *
 * Body (any subset):
 *   - label, description, icon, color
 *   - key (only allowed if NOT in use — see checkKeyInUse)
 *
 * Note: `isArchived` is NOT settable here. Use the dedicated archive/
 * restore endpoints to keep the audit log granular.
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { label, description, icon, color, key: newKey } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const originalKey = category.key;
  const originalLabel = category.label;

  // Handle key change — guarded by in-use check
  if (typeof newKey === "string" && newKey.trim()) {
    const requestedKey = newKey.trim().toLowerCase();
    if (requestedKey !== originalKey) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(requestedKey)) {
        throw new ApiError(400, "Key must be kebab-case");
      }

      const usage = await checkKeyInUse(originalKey);
      if (usage.inUse) {
        throw new ApiError(
          400,
          `Cannot change key — category is in use by ${usage.questionCount} active question(s) and ${usage.assessmentCount} submitted assessment(s). Display fields (label, description, icon, colour) can still be edited.`
        );
      }

      // Collision check on the new key
      const colliding = await Category.findOne({ key: requestedKey }).lean();
      if (colliding) {
        throw new ApiError(409, `Key '${requestedKey}' already exists.`);
      }

      category.key = requestedKey;
    }
  }

  if (typeof label === "string" && label.trim()) {
    category.label = label.trim();
  }
  if (typeof description === "string") {
    category.description = description.trim();
  }
  if (typeof icon === "string") {
    category.icon = icon.trim();
  }
  if (typeof color === "string") {
    if (!ALLOWED_COLORS.includes(color)) {
      throw new ApiError(400, `Color must be one of: ${ALLOWED_COLORS.join(", ")}`);
    }
    category.color = color;
  }

  category.lastEditedBy = req.user._id;
  category.lastEditedAt = new Date();

  await category.save();

  categoryCache.invalidate();

  await logAdminAction(req, "category.update", {
    targetType: "category",
    targetId: category._id,
    details: {
      key: category.key,
      label: category.label,
      keyChanged: category.key !== originalKey,
      labelChanged: category.label !== originalLabel,
    },
  });

  res.status(200).json({
    success: true,
    message: "Category updated.",
    data: { category },
  });
});

/**
 * @desc    Archive a category (soft-delete)
 * @route   POST /api/admin/categories/:id/archive
 * @access  Admin
 *
 * Active questions in this category will stop appearing in NEW assessments
 * (cascade-filter in questionController). Existing in-progress assessments
 * keep their locked categoryOrder unchanged.
 */
const archiveCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  if (category.isArchived) {
    throw new ApiError(400, "Category is already archived.");
  }

  // Inform the caller how many active questions get auto-hidden
  const affected = await Question.countDocuments({
    category: category.key,
    isArchived: { $ne: true },
  });

  category.isArchived = true;
  category.lastEditedBy = req.user._id;
  category.lastEditedAt = new Date();
  await category.save();

  categoryCache.invalidate();

  await logAdminAction(req, "category.archive", {
    targetType: "category",
    targetId: category._id,
    details: {
      key: category.key,
      label: category.label,
      hiddenQuestions: affected,
    },
  });

  res.status(200).json({
    success: true,
    message: `Category archived. ${affected} active question(s) will be hidden from new assessments.`,
    data: { category, hiddenQuestions: affected },
  });
});

/**
 * @desc    Restore an archived category
 * @route   POST /api/admin/categories/:id/restore
 * @access  Admin
 */
const restoreCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  if (!category.isArchived) {
    throw new ApiError(400, "Category is not archived.");
  }

  category.isArchived = false;
  category.lastEditedBy = req.user._id;
  category.lastEditedAt = new Date();
  await category.save();

  categoryCache.invalidate();

  await logAdminAction(req, "category.restore", {
    targetType: "category",
    targetId: category._id,
    details: { key: category.key, label: category.label },
  });

  res.status(200).json({
    success: true,
    message: "Category restored.",
    data: { category },
  });
});

/**
 * @desc    Reorder a category (move up/down)
 * @route   POST /api/admin/categories/:id/reorder
 * @access  Admin
 *
 * Body: { direction: "up" | "down" }
 *
 * Reorder operates across BOTH active and archived categories — this keeps
 * the order field stable if a category is later restored. Admin UI hides
 * archived categories from the main list anyway.
 */
const reorderCategory = asyncHandler(async (req, res) => {
  const { direction } = req.body;
  if (!["up", "down"].includes(direction)) {
    throw new ApiError(400, "Direction must be 'up' or 'down'");
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Find the neighbour to swap with — only among non-archived,
  // since admin UI only shows active in the reorder list
  const neighbour = await Category.findOne({
    isArchived: { $ne: true },
    order: direction === "up" ? { $lt: category.order } : { $gt: category.order },
  }).sort({ order: direction === "up" ? -1 : 1 });

  if (!neighbour) {
    return res.status(200).json({
      success: true,
      message: `Already at the ${direction === "up" ? "top" : "bottom"}`,
    });
  }

  // Swap orders
  const tempOrder = category.order;
  category.order = neighbour.order;
  neighbour.order = tempOrder;

  await Promise.all([category.save(), neighbour.save()]);

  categoryCache.invalidate();

  await logAdminAction(req, "category.reorder", {
    targetType: "category",
    targetId: category._id,
    details: { direction, key: category.key },
  });

  res.status(200).json({
    success: true,
    message: "Category reordered.",
  });
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  reorderCategory,
};