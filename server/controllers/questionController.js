/**
 * Question Controller
 * -------------------
 * Read-only endpoints for fetching questionnaire questions.
 *
 * Supports randomized order via ?assessmentId=xxx query param.
 * If provided, questions are returned in the order locked-in
 * for that specific assessment.
 */

const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const CATEGORIES = require("../utils/categories");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

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

  // 1. Fetch all questions, default sorted (used as fallback)
  const questions = await Question.find()
    .sort({ category: 1, order: 1 })
    .lean();

  // 2. Group questions by category
  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  }

  // 3. Determine the order — randomized (per assessment) or default (alphabetical)
  let categoryKeys = Object.keys(CATEGORIES);
  let assessment = null;

  if (assessmentId) {
    assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }
    if (assessment.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not your assessment");
    }

    // Use the saved category order if it exists
    if (assessment.categoryOrder && assessment.categoryOrder.length > 0) {
      categoryKeys = assessment.categoryOrder;
    }
  }

  // 4. Build the final array — preserves your category metadata
  const categoriesArray = categoryKeys
    .map((key) => {
      // Skip categories that aren't in CATEGORIES (defensive)
      if (!CATEGORIES[key]) return null;

      let categoryQuestions = byCategory[key] || [];

      // Apply randomized question order if available
      if (assessment?.questionOrder) {
        const savedOrder = assessment.questionOrder.get(key);
        if (savedOrder && savedOrder.length > 0) {
          // Build a map for O(1) lookup, then apply the saved order
          const idToQuestion = new Map(
            categoryQuestions.map((q) => [q._id.toString(), q])
          );
          categoryQuestions = savedOrder
            .map((id) => idToQuestion.get(id))
            .filter(Boolean); // skip any deleted questions
        }
      }

      return {
        ...CATEGORIES[key],
        key,
        questions: categoryQuestions,
      };
    })
    .filter(Boolean); // remove any nulls

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