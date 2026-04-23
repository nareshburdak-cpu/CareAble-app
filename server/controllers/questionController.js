/**
 * Question Controller
 * -------------------
 * Read-only endpoints for fetching questionnaire questions.
 */

const Question = require("../models/Question");
const CATEGORIES = require("../utils/categories");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Get all questions, grouped by category
 * @route   GET /api/questions
 * @access  Private
 */
const getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find()
    .sort({ category: 1, order: 1 })
    .lean();

  // Initialize categories in the correct order with empty question arrays
  const grouped = {};
  for (const key of Object.keys(CATEGORIES)) {
    grouped[key] = {
      ...CATEGORIES[key],
      key,
      questions: [],
    };
  }

  // Populate questions into their categories
  questions.forEach((q) => {
    if (grouped[q.category]) {
      grouped[q.category].questions.push(q);
    }
  });

  // Convert to ordered array
  const categoriesArray = Object.keys(CATEGORIES).map((key) => grouped[key]);

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