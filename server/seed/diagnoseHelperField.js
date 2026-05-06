// server/seed/diagnoseHelperField.js

/**
 * Diagnose helper / helpText field state in the Question collection.
 * --------------------------------------------------------------------
 * Read-only. Counts how many questions have:
 *   - `helper` populated (the schema-defined field)
 *   - `helpText` populated (the bug — silently dropped by Mongoose
 *      strict mode unless `strict: false` was set on the schema)
 *
 * Run: node seed/diagnoseHelperField.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Use the raw collection — bypasses Mongoose strict mode so we can
    // actually SEE if any helpText values made it past the schema filter.
    const col = mongoose.connection.db.collection("questions");

    const total = await col.countDocuments({});
    const withHelper = await col.countDocuments({ helper: { $exists: true, $ne: "" } });
    const withHelpText = await col.countDocuments({ helpText: { $exists: true, $ne: "" } });

    console.log(`Total questions:              ${total}`);
    console.log(`With non-empty 'helper':      ${withHelper}`);
    console.log(`With non-empty 'helpText':    ${withHelpText}`);

    if (withHelpText > 0) {
      console.log(`\n⚠️  Found ${withHelpText} document(s) with stray 'helpText' field.`);
      console.log("   These would be cleaned up by the upcoming reseed (which drops the collection).");
      const samples = await col
        .find({ helpText: { $exists: true, $ne: "" } })
        .project({ _id: 1, category: 1, text: 1, helpText: 1 })
        .limit(3)
        .toArray();
      console.log("\n   Sample documents:");
      samples.forEach((s) => {
        console.log(`     - [${s.category}] "${s.text?.slice(0, 60)}..."`);
        console.log(`         helpText: "${s.helpText}"`);
      });
    } else {
      console.log("\n✓  No stray 'helpText' field found. Mongoose strict mode dropped them as expected.");
    }

    await mongoose.connection.close();
    console.log("\n👋 Disconnected.");
  } catch (err) {
    console.error("❌ Diagnostic failed:", err);
    process.exit(1);
  }
};

run();