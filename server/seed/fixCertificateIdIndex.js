/**
 * Fix the certificateId index — make it sparse so nulls don't trigger
 * duplicate-key errors when creating new in-progress assessments.
 *
 * Usage: node seed/fixCertificateIdIndex.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Assessment = require("../models/Assessment");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Show current indexes
    console.log("📋 Current indexes BEFORE fix:");
    let indexes = await Assessment.collection.indexes();
    indexes.forEach((idx) => {
      const sparse = idx.sparse ? " (sparse)" : "";
      const unique = idx.unique ? " (unique)" : "";
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}`);
    });
    console.log("");

    // Drop the broken certificateId index if it exists
    const certIdx = indexes.find((i) => i.name === "certificateId_1");
    if (certIdx) {
      console.log("🗑️  Dropping old certificateId_1 index...");
      await Assessment.collection.dropIndex("certificateId_1");
      console.log("✅ Dropped\n");
    } else {
      console.log("ℹ️  No certificateId_1 index found — nothing to drop\n");
    }

    // Sync indexes — this will recreate from the schema (now properly sparse)
    console.log("🔄 Re-syncing schema indexes...");
    await Assessment.syncIndexes();
    console.log("✅ Done\n");

    // Show final indexes
    console.log("📋 Indexes AFTER fix:");
    indexes = await Assessment.collection.indexes();
    indexes.forEach((idx) => {
      const partial = idx.partialFilterExpression
        ? ` (partial: ${JSON.stringify(idx.partialFilterExpression)})`
        : "";
      const sparse = idx.sparse ? " (sparse)" : "";
      const unique = idx.unique ? " (unique)" : "";
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}${partial}`);
    });

    await mongoose.connection.close();
    console.log("\n🎉 Fix complete! You can now restart the backend with `npm run dev`.");
  } catch (err) {
    console.error("❌ Fix failed:", err);
    process.exit(1);
  }
};

run();