/**
 * Sync all Mongoose schema indexes with the database.
 * Run after schema index changes.
 *
 * Usage: node seed/syncIndexes.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Assessment = require("../models/Assessment");
const User = require("../models/User");
const Question = require("../models/Question");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🔄 Syncing Assessment indexes...");
    await Assessment.syncIndexes();
    console.log("✅ Done");

    console.log("🔄 Syncing User indexes...");
    await User.syncIndexes();
    console.log("✅ Done");

    console.log("🔄 Syncing Question indexes...");
    await Question.syncIndexes();
    console.log("✅ Done\n");

    // Show the resulting indexes for assessments
    const indexes = await Assessment.collection.indexes();
    console.log("📋 Assessment indexes:");
    indexes.forEach((idx) => {
      const partial = idx.partialFilterExpression
        ? ` (partial: ${JSON.stringify(idx.partialFilterExpression)})`
        : "";
      const sparse = idx.sparse ? " (sparse)" : "";
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}${partial}${sparse}`);
    });

    await mongoose.connection.close();
    console.log("\n🎉 Done!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
};

run();