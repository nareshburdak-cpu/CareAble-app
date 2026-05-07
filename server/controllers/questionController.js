// server/controllers/questionController.js

/**
 * Question Controller
 * -------------------
 * Read-only endpoints for fetching questionnaire questions.
 *
 * Phase 12-A Task 6:
 *   Response now includes a flat `questions` array (interleaved random
 *   order across all categories) alongside the existing `categories`
 *   grouped shape. Assessment.jsx uses the flat array; Results.jsx
 *   continues using categories.
 */

const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const categoryCache = require("../utils/categoryCache");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const toPublicCategory = (cat) => ({
  key: cat.key,
  label: cat.label,
  description: cat.description,
  icon: cat.icon,
  color: cat.color,
});

/**
 * @desc    Get all questions, grouped by category + flat interleaved list
 * @route   GET /api/questions?assessmentId=xxx
 * @access  Private
 */
const getQuestions = asyncHandler(async (req, res) => {
  const { assessmentId } = req.query;

  const activeCategories = await categoryCache.getCategories();
  const allCategories = await categoryCache.getAllCategoriesIncludingArchived();

  const activeMap = Object.fromEntries(activeCategories.map((c) => [c.key, c]));
  const allMap = Object.fromEntries(allCategories.map((c) => [c.key, c]));

  const activeKeys = activeCategories.map((c) => c.key);

  const questions = await Question.find({
    isArchived: { $ne: true },
    category: { $in: activeKeys },
  })
    .sort({ category: 1, order: 1 })
    .lean();

  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  }

  let categoryKeys = activeKeys;
  let assessment = null;

  if (assessmentId) {
    assessment = await Assessment.findById(assessmentId);

    if (!assessment) throw new ApiError(404, "Assessment not found");
    if (assessment.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not your assessment");
    }

    if (assessment.categoryOrder && assessment.categoryOrder.length > 0) {
      categoryKeys = assessment.categoryOrder;

      const lockedKeys = categoryKeys.filter((k) => !activeMap[k] && allMap[k]);
      if (lockedKeys.length > 0) {
        const extraQuestions = await Question.find({
          isArchived: { $ne: true },
          category: { $in: lockedKeys },
        })
          .sort({ category: 1, order: 1 })
          .lean();
        for (const q of extraQuestions) {
          if (!byCategory[q.category]) byCategory[q.category] = [];
          byCategory[q.category].push(q);
        }
      }
    }
  }

  // Build the categorised array (unchanged — used by Results.jsx)
  const categoriesArray = categoryKeys
    .map((key) => {
      const cat = allMap[key];
      if (!cat) return null;

      let categoryQuestions = byCategory[key] || [];

      if (assessment?.questionOrder) {
        const savedOrder = assessment.questionOrder.get(key);
        if (savedOrder && savedOrder.length > 0) {
          const idToQuestion = new Map(
            categoryQuestions.map((q) => [q._id.toString(), q])
          );
          categoryQuestions = savedOrder
            .map((id) => idToQuestion.get(id))
            .filter(Boolean);
        }
      }

      return {
        ...toPublicCategory(cat),
        questions: categoryQuestions,
      };
    })
    .filter(Boolean);

  // ── NEW: flat interleaved question list for the paginated assessment UI ──
  // Strategy: interleave round-robin across categories so adjacent questions
  // are from different domains. This prevents the user from noticing domain
  // patterns even without visible domain labels.
  //
  // Example with 3 categories × 3 questions each:
  //   [A1, B1, C1, A2, B2, C2, A3, B3, C3]
  //
  // If assessmentId is provided (locked order), we respect the locked
  // per-category question order but interleave across categories.
  // If no assessmentId, we return the default sorted order interleaved.
  const flatQuestions = buildInterleavedFlat(categoriesArray, allMap);

  res.status(200).json({
    success: true,
    data: {
      totalQuestions: flatQuestions.length,
      totalCategories: categoriesArray.length,
      categories: categoriesArray,       // used by Results.jsx (unchanged)
      questions: flatQuestions,          // NEW — used by Assessment.jsx
    },
  });
});

/**
 * Interleave questions round-robin across categories.
 * Each question gets a `categoryLabel` and `categoryKey` attached
 * so the frontend has context if needed (e.g. for accessibility labels),
 * without showing it as a visible domain header.
 */
function buildInterleavedFlat(categoriesArray, allMap) {
  if (!categoriesArray.length) return [];

  // Build per-category queues
  const queues = categoriesArray
    .map((cat) =>
      cat.questions.map((q) => ({
        ...q,
        categoryKey: cat.key,
        categoryLabel: cat.label,
      }))
    )
    .filter((q) => q.length > 0);

  const result = [];
  let maxLen = Math.max(...queues.map((q) => q.length));

  for (let i = 0; i < maxLen; i++) {
    for (const queue of queues) {
      if (i < queue.length) {
        result.push(queue[i]);
      }
    }
  }

  return result;
}

module.exports = { getQuestions };