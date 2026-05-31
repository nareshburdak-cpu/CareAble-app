/** @file Cached settings helpers for assessment configuration values. */
// server/utils/settings.js

/**
 * Settings utility
 * ----------------
 * Cache-backed accessor for platform settings.
 *
 * - Reads from in-memory cache when warm
 * - Falls back to DB on first read
 * - Falls back to schema defaults if DB has no record
 * - invalidate() clears the cache (call after admin updates)
 *
 * Why cache: settings are read on every assessment start, but
 * updated only by admins. Reading from DB every start would be
 * wasteful. Same pattern as categoryCache.
 *
 * Schema definitions live here — adding a new setting means:
 *   1) add it to SETTING_SCHEMA below
 *   2) admins can edit via /api/admin/settings
 */

const Setting = require("../models/Setting");

// ── Setting definitions ────────────────────────────────────────────
const SETTING_SCHEMA = {
  questionsPerCategory: {
    default: 3,
    type: "number",
    description:
      "How many questions are randomly sampled from each capability domain when a carer starts an assessment. Higher = longer assessment, more reliable scoring.",
    validate: (v) => {
      if (!Number.isInteger(v)) return "Must be a whole number";
      if (v < 1) return "Must be at least 1";
      if (v > 10) return "Maximum is 10 per category";
      return null;
    },
  },
  assessmentCooldownHours: {
    default: 24,
    type: "number",
    description:
      "How long carers must wait before retaking an assessment (in hours). Default is 24 hours (1 day). Set to 1 for testing, up to 720 (30 days).",
    validate: (v) => {
      if (!Number.isInteger(v)) return "Must be a whole number";
      if (v < 1) return "Must be at least 1 hour";
      if (v > 720) return "Maximum is 720 hours (30 days)";
      return null;
    },
  },
  inProgressAssessmentExpiryDays: {
    default: 7,
    type: "number",
    description:
      "How many days carers have to complete an in-progress assessment before it expires and is deleted. Default is 7 days.",
    validate: (v) => {
      if (!Number.isInteger(v)) return "Must be a whole number";
      if (v < 1) return "Must be at least 1 day";
      if (v > 90) return "Maximum is 90 days";
      return null;
    },
  },
};

// In-memory cache
let cache = null;

/**
 * Lazily warm the cache.
 * Reads all settings from the DB, merges with defaults.
 */
async function warmCache() {
  const docs = await Setting.find().lean();
  const fromDb = Object.fromEntries(docs.map((d) => [d.key, d.value]));

  cache = {};
  for (const [key, def] of Object.entries(SETTING_SCHEMA)) {
    cache[key] = fromDb[key] !== undefined ? fromDb[key] : def.default;
  }
}

/**
 * Get a setting value. Lazily warms cache on first call.
 * Returns the schema default if the key doesn't exist.
 */
async function getSetting(key) {
  if (!cache) await warmCache();
  if (!(key in SETTING_SCHEMA)) {
    throw new Error(`Unknown setting key: ${key}`);
  }
  return cache[key];
}

/**
 * Get all settings as a single object (for admin UI).
 * Includes metadata so the UI can render labels/descriptions/types.
 */
async function getAllSettings() {
  if (!cache) await warmCache();
  return Object.entries(SETTING_SCHEMA).map(([key, def]) => ({
    key,
    value: cache[key],
    default: def.default,
    type: def.type,
    description: def.description,
  }));
}

/**
 * Set a setting value. Validates against schema.
 * Returns the new cached value.
 */
async function setSetting(key, value, editorId) {
  const def = SETTING_SCHEMA[key];
  if (!def) {
    throw new Error(`Unknown setting key: ${key}`);
  }

  // Type coerce numbers (in case the UI sends "3" as a string)
  let coerced = value;
  if (def.type === "number" && typeof value === "string" && value.trim() !== "") {
    coerced = Number(value);
  }

  // Validate
  if (typeof def.validate === "function") {
    const err = def.validate(coerced);
    if (err) {
      const error = new Error(err);
      error.statusCode = 400;
      throw error;
    }
  }

  await Setting.findOneAndUpdate(
    { key },
    {
      key,
      value: coerced,
      description: def.description,
      lastEditedBy: editorId,
      lastEditedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  invalidate();
  return coerced;
}

/** Clear the cache. Call after admin updates. */
function invalidate() {
  cache = null;
}

module.exports = {
  getSetting,
  getAllSettings,
  setSetting,
  invalidate,
  SETTING_SCHEMA,
};
