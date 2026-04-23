/**
 * Scoring Engine
 * --------------
 * Calculates scores from raw assessment answers.
 *
 * Each question produces a 0-100 score.
 * Category score = average of its question scores.
 * Overall score  = average of category scores.
 *
 * Level bands:
 *   0-39  Emerging
 *   40-59 Developing
 *   60-79 Confident
 *   80+   Advanced
 */

// Map frequency option values → 0-100 score
const FREQUENCY_SCORES = {
  never: 0,
  rarely: 25,
  sometimes: 50,
  often: 75,
  always: 100,
};

/**
 * Score a single answer based on its question type.
 * Returns a number 0-100 or null if no/invalid answer.
 */
function scoreAnswer(question, answer) {
  if (!answer) return null;

  switch (question.type) {
    case "likert": {
      const v = Number(answer.value);
      if (Number.isNaN(v) || v < 1 || v > 5) return null;
      return v * 20; // 1→20, 2→40, ..., 5→100
    }

    case "frequency": {
      if (!answer.value) return null;
      const score = FREQUENCY_SCORES[answer.value];
      return score !== undefined ? score : null;
    }

    case "multi": {
      if (!Array.isArray(answer.values)) return null;
      const totalOptions = question.options?.length || 0;
      if (totalOptions === 0) return null;
      return Math.round((answer.values.length / totalOptions) * 100);
    }

    default:
      return null;
  }
}

/**
 * Assign a skill level based on an overall 0-100 score.
 */
function scoreLevel(score) {
  if (score >= 80) return "Advanced";
  if (score >= 60) return "Confident";
  if (score >= 40) return "Developing";
  return "Emerging";
}

/**
 * Main scoring function.
 *
 * Input:
 *   answersMap  - Mongoose Map of questionId → answer
 *   questions   - array of Question documents
 *
 * Output:
 *   {
 *     categoryScores: { "personal-care": 72, ... },
 *     overallScore: 68,
 *     level: "Confident"
 *   }
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
    const questionScores = [];

    for (const q of qs) {
      const answer = answersMap.get(q._id.toString());
      const score = scoreAnswer(q, answer);
      if (score !== null) questionScores.push(score);
    }

    if (questionScores.length > 0) {
      const avg = questionScores.reduce((a, b) => a + b, 0) / questionScores.length;
      categoryScores[category] = Math.round(avg);
    } else {
      categoryScores[category] = 0;
    }
  }

  // Overall score = average of category scores
  const categoryValues = Object.values(categoryScores);
  const overallScore =
    categoryValues.length > 0
      ? Math.round(categoryValues.reduce((a, b) => a + b, 0) / categoryValues.length)
      : 0;

  return {
    categoryScores,
    overallScore,
    level: scoreLevel(overallScore),
  };
}

module.exports = {
  calculateScores,
  scoreAnswer,
  scoreLevel,
};