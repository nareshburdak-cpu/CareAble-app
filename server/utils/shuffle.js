/** @file Array shuffling helper for randomized assessment question order. */
/**
 * Fisher-Yates shuffle — the gold standard for random array shuffling.
 *
 * Why not Math.random() compare in sort()?
 *   Because Array.sort() expects a deterministic comparator.
 *   Random comparators give biased results (some orderings are more likely).
 *
 * Fisher-Yates is O(n) and provably uniform.
 *
 * @param {Array} array - input array (NOT mutated)
 * @returns {Array} a new shuffled array
 */
function shuffle(array) {
  const result = [...array];   // shallow copy — don't mutate original
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

module.exports = { shuffle };