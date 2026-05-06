// server/utils/scoring.js

/**
 * Scoring Engine — Brief-aligned (Phase 12-A)
 * --------------------------------------------
 * Per-domain mean scoring on a 1–5 scale.
 *
 * Scoring rules:
 *   - Likert (1-5):    raw value used directly (1.0 – 5.0)
 *   - Frequency:       string label mapped to 1–5 equivalent
 *   - Multi-select:    EXCLUDED — demographic/context only, not scored
 *
 * Domain score = mean of all scored answers in that domain (1.00 – 5.00)
 * Overall score = mean of all domain scores (1.00 – 5.00)
 *
 * Three-tier level system (brief spec):
 *   Strength  4.0 – 5.0   Strong demonstrated capability
 *   Growth    3.0 – 3.9   Developing, room to improve
 *   Support   1.0 – 2.9   Needs additional support
 */

// Frequency label → 1-5 equivalent
// Maps the semantic meaning to the same scale as Likert.
//   never     → 1  (equivalent to "Strongly Disagree")
//   rarely    → 2
//   sometimes → 3
//   often     → 4
//   always    → 5  (equivalent to "Strongly Agree")
const FREQUENCY_TO_SCORE = {
  never:     1,
  rarely:    2,
  sometimes: 3,
  often:     4,
  always:    5,
};

/**
 * Score a single answer. Returns a float 1–5 or null if not scoreable.
 * Multi-select questions always return null (excluded from scoring).
 */
function scoreAnswer(question, answer) {
  if (!answer) return null;

  switch (question.type) {
    case "likert": {
      const v = Number(answer.value);
      if (Number.isNaN(v) || v < 1 || v > 5) return null;
      return v; // 1, 2, 3, 4, or 5 — used directly
    }

    case "frequency": {
      if (!answer.value) return null;
      const score = FREQUENCY_TO_SCORE[answer.value];
      return score !== undefined ? score : null;
    }

    case "multi":
      // Multi-select is demographic/context only. Not scored.
      return null;

    default:
      return null;
  }
}

/**
 * Assign a tier level based on the overall mean score (1–5 scale).
 *
 * Bands per Capstone Brief:
 *   Strength  >= 4.0
 *   Growth    >= 3.0  (and < 4.0)
 *   Support   < 3.0
 */
function scoreLevel(mean) {
  if (mean >= 4.0) return "Strength";
  if (mean >= 3.0) return "Growth";
  return "Support";
}

/**
 * Main scoring function.
 *
 * Input:
 *   answersMap  - Mongoose Map of questionId → answer
 *   questions   - array of Question documents (active, correct category set)
 *
 * Output:
 *   {
 *     categoryScores: { "communication-relational-care": 4.20, ... },
 *     overallScore:   3.85,
 *     level:          "Growth"
 *   }
 *
 * Notes:
 *   - categoryScores values are floats rounded to 2dp
 *   - overallScore is a float rounded to 2dp
 *   - Categories with NO scored answers get a score of null (excluded
 *     from overall mean). This handles edge cases where a domain has
 *     only multi-select questions.
 *   - A domain with all answers missing still gets null (not 0) so
 *     the overall mean isn't artificially dragged down.
 */
function calculateScores(answersMap, questions) {
  // Group questions by category
  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  }

  // Score each category
  const categoryScores = {};
  for (const [category, qs] of Object.entries(byCategory)) {
    const scoredValues = [];

    for (const q of qs) {
      const answer = answersMap.get(q._id.toString());
      const score = scoreAnswer(q, answer);
      if (score !== null) scoredValues.push(score);
    }

    if (scoredValues.length > 0) {
      const mean = scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length;
      categoryScores[category] = Math.round(mean * 100) / 100; // 2dp
    } else {
      // Category has questions but none are scoreable (all multi, or all unanswered).
      // Exclude from overall mean by omitting this key.
      // Storing 0 would unfairly penalise the carer.
      categoryScores[category] = null;
    }
  }

  // Overall score = mean of non-null category scores only
  const scoredCategories = Object.values(categoryScores).filter((v) => v !== null);
  const overallScore =
    scoredCategories.length > 0
      ? Math.round((scoredCategories.reduce((a, b) => a + b, 0) / scoredCategories.length) * 100) / 100
      : null;

  return {
    categoryScores,
    overallScore,
    level: scoreLevel(overallScore ?? 1),
  };
}

module.exports = {
  calculateScores,
  scoreAnswer,
  scoreLevel,
};