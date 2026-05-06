// server/controllers/questionController.js

/**
 * Question Controller
 * -------------------
 * Read-only endpoints for fetching questionnaire questions.
 *
 * Supports randomized order via ?assessmentId=xxx query param.
 * If provided, questions are returned in the order locked-in
 * for that specific assessment.
 *
 * Categories are sourced from the in-memory cache (server/utils/categoryCache),
 * which loads from the Category collection. Admin-archived categories are
 * filtered out for new assessments, but in-progress assessments preserve
 * their locked categoryOrder — we resolve archived categories defensively
 * so a mid-take archive by an admin doesn't break the carer's flow.
 */

const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const categoryCache = require("../utils/categoryCache");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// Pick only the fields the frontend should see — never leak admin metadata
// (_id, isArchived, lastEditedBy, etc.) to the carer-facing endpoint.
const toPublicCategory = (cat) => ({
  key: cat.key,
  label: cat.label,
  description: cat.description,
  icon: cat.icon,
  color: cat.color,
});

/**
 * @desc    Get all questions, grouped by category
 * @route   GET /api/questions?assessmentId=xxx
 * @access  Private
 *
 * Query params:
 *   - assessmentId (optional): if provided, returns questions in the
 *     randomized order saved on that assessment
 */
const getQuestions = asyncHandler(async (req, res) => {
  const { assessmentId } = req.query;

  // 1. Load category metadata. We need both the active-only map (for
  //    filtering questions on new assessments) and the all-categories
  //    map (so we can resolve archived keys referenced by an in-progress
  //    assessment's locked categoryOrder).
  const activeCategories = await categoryCache.getCategories();
  const allCategories = await categoryCache.getAllCategoriesIncludingArchived();

  const activeMap = Object.fromEntries(activeCategories.map((c) => [c.key, c]));
  const allMap = Object.fromEntries(allCategories.map((c) => [c.key, c]));

  // 2. Fetch all questions belonging to active categories, default sorted.
  //    We exclude:
  //      - archived questions (Question.isArchived = true)
  //      - questions whose category is archived (cascade-filter on read)
  const activeKeys = activeCategories.map((c) => c.key);

  const questions = await Question.find({
    isArchived: { $ne: true },
    category: { $in: activeKeys },
  })
    .sort({ category: 1, order: 1 })
    .lean();

  // 3. Group questions by category
  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  }

  // 4. Determine the order — randomized (per assessment) or default (active order)
  let categoryKeys = activeKeys;
  let assessment = null;

  if (assessmentId) {
    assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }
    if (assessment.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not your assessment");
    }

    // Use the saved category order if it exists.
    // This may include keys that are now archived — that's OK, we still
    // want to show them so the carer can complete the assessment they
    // started. We also need to refetch any questions for those archived
    // categories that were filtered out in step 2.
    if (assessment.categoryOrder && assessment.categoryOrder.length > 0) {
      categoryKeys = assessment.categoryOrder;

      // Top up byCategory with questions from archived categories the
      // carer's assessment is locked to. We DO honour question-level
      // archive flags, but ignore the category-level archive for
      // already-started assessments.
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

  // 5. Build the final array — preserves category metadata via allMap so
  //    archived-but-locked categories still resolve.
  const categoriesArray = categoryKeys
    .map((key) => {
      const cat = allMap[key];
      // Defensive: skip if the category record was hard-deleted somehow
      // (shouldn't happen — we don't allow hard delete — but no crash if it does)
      if (!cat) return null;

      let categoryQuestions = byCategory[key] || [];

      // Apply randomized question order if available
      if (assessment?.questionOrder) {
        const savedOrder = assessment.questionOrder.get(key);
        if (savedOrder && savedOrder.length > 0) {
          const idToQuestion = new Map(
            categoryQuestions.map((q) => [q._id.toString(), q])
          );
          categoryQuestions = savedOrder
            .map((id) => idToQuestion.get(id))
            .filter(Boolean); // skip any deleted questions
        }
      }

      return {
        ...toPublicCategory(cat),
        questions: categoryQuestions,
      };
    })
    .filter(Boolean);

  res.status(200).json({
    success: true,
    data: {
      totalQuestions: questions.length,
      totalCategories: categoriesArray.length,
      categories: categoriesArray,
    },
  });
});

module.exports = { getQuestions };