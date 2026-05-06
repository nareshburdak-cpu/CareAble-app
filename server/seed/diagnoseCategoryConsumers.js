// server/seed/diagnoseCategoryConsumers.js

/**
 * Diagnose Category Consumers
 * ---------------------------
 * Scans server-side source files for any remaining references to
 * utils/categories.js. After Step 1.4 migration, only the seed file
 * (categories.seed.js) should reference it.
 *
 * Run: node seed/diagnoseCategoryConsumers.js
 */

const fs = require("fs");
const path = require("path");

const SERVER_ROOT = path.resolve(__dirname, "..");
const SEARCH_DIRS = ["controllers", "routes", "models", "middleware", "utils"];
const PATTERNS = [
  /require\(["']\.\.?\/.*utils\/categories["']\)/,
  /require\(["']\.\/categories["']\)/,
  /from ["'].*utils\/categories["']/,
];

const findRefs = (dir) => {
  const hits = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      hits.push(...findRefs(full));
    } else if (e.isFile() && /\.(js|mjs|cjs)$/.test(e.name)) {
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (PATTERNS.some((p) => p.test(line))) {
          hits.push({ file: path.relative(SERVER_ROOT, full), lineNum: idx + 1, line: line.trim() });
        }
      });
    }
  }
  return hits;
};

console.log("Scanning for utils/categories consumers...\n");

const allHits = [];
for (const sub of SEARCH_DIRS) {
  const dir = path.join(SERVER_ROOT, sub);
  if (fs.existsSync(dir)) {
    allHits.push(...findRefs(dir));
  }
}

if (allHits.length === 0) {
  console.log("✓ No consumers found in controllers/routes/models/middleware/utils.");
  console.log("  utils/categories.js is now seed-only.");
} else {
  console.log(`⚠️  Found ${allHits.length} reference(s):\n`);
  allHits.forEach((h) => {
    console.log(`   ${h.file}:${h.lineNum}`);
    console.log(`     ${h.line}\n`);
  });
  console.log("Each of these should either be migrated to categoryCache or be the seed file.");
}

console.log("\n(Note: this script does NOT scan the seed/ directory — that's expected to import categories.js.)");