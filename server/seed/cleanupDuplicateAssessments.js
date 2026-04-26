/**
 * Cleanup script: removes duplicate in-progress assessments.
 * Keeps the newest (most recently updated) per user, deletes the rest.
 *
 * Run BEFORE syncing indexes if duplicates exist.
 *
 * Usage: node seed/cleanupDuplicateAssessments.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Assessment = require("../models/Assessment");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Group in-progress assessments by user
    const groups = await Assessment.aggregate([
      { $match: { status: "in-progress" } },
      { $group: { _id: "$user", docs: { $push: "$$ROOT" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    console.log(`📋 Found ${groups.length} user(s) with duplicate in-progress assessments\n`);

    let totalDeleted = 0;
    for (const group of groups) {
      // Sort by updatedAt desc — keep the first (newest), delete the rest
      const sorted = group.docs.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      const toDelete = sorted.slice(1).map((d) => d._id);

      console.log(`👤 User ${group._id}: keeping ${sorted[0]._id}, deleting ${toDelete.length}`);

      await Assessment.deleteMany({ _id: { $in: toDelete } });
      totalDeleted += toDelete.length;
    }

    console.log(`\n🎉 Cleanup complete. Deleted ${totalDeleted} duplicate assessment(s).`);
    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
};

run();