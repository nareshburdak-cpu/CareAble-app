// server/utils/categoryCache.js

/**
 * Category Cache
 * --------------
 * In-memory cache for the Category collection. Other parts of the app
 * (questionController, scoring, certificate generation, public endpoints)
 * read categories MANY times per minute, while admins mutate them rarely.
 * Caching avoids hammering Mongo on every assessment fetch.
 *
 * Lifecycle:
 *   - Lazy-loaded on first call (no eager startup load).
 *   - Invalidated by admin mutation endpoints (create/update/archive/reorder).
 *   - Cleared on process restart.
 *
 * Caveat — multi-instance deployments:
 * This cache is in-process. If you ever scale Render beyond 1 instance,
 * a mutation on instance A won't invalidate instance B's cache until B
 * restarts. For the current free-tier (single instance) deployment
 * this is fine. If you scale, replace this with a TTL or Redis pub/sub.
 */

const Category = require("../models/Category");

// Cache state
let cachedActive = null;     // [{ key, label, ... }, ...] sorted by order
let cachedAll = null;        // includes archived
let cachedMap = null;        // { [key]: categoryDoc } (active only)

const loadActive = async () => {
  cachedActive = await Category.find({ isArchived: false })
    .sort({ order: 1 })
    .lean();
  // Build the map alongside — same data, different shape, zero extra DB cost
  cachedMap = Object.fromEntries(cachedActive.map((c) => [c.key, c]));
};

const loadAll = async () => {
  cachedAll = await Category.find()
    .sort({ order: 1 })
    .lean();
};

/**
 * @returns {Promise<Array>} Active (non-archived) categories sorted by order.
 */
const getCategories = async () => {
  if (cachedActive === null) await loadActive();
  return cachedActive;
};

/**
 * @returns {Promise<Array>} All categories (including archived) sorted by order.
 *                           Used by admin endpoints.
 */
const getAllCategoriesIncludingArchived = async () => {
  if (cachedAll === null) await loadAll();
  return cachedAll;
};

/**
 * @returns {Promise<Object>} Map of active category key → category doc.
 *                            Useful for O(1) lookups during scoring/rendering.
 */
const getCategoryMap = async () => {
  if (cachedMap === null) await loadActive();
  return cachedMap;
};

/**
 * @param   {string} key
 * @returns {Promise<Object|null>} The active category with this key, or null.
 */
const getCategoryByKey = async (key) => {
  const map = await getCategoryMap();
  return map[key] || null;
};

/**
 * Invalidate the cache. Call this after any mutation (create/update/archive/
 * reorder) so subsequent reads load fresh data from Mongo.
 */
const invalidate = () => {
  cachedActive = null;
  cachedAll = null;
  cachedMap = null;
};

module.exports = {
  getCategories,
  getAllCategoriesIncludingArchived,
  getCategoryMap,
  getCategoryByKey,
  invalidate,
};