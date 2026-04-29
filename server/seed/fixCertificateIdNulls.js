/**
 * Fix existing assessment docs with certificateId: null
 * ------------------------------------------------------
 * The sparse index treats `null` as a VALUE, not as missing.
 * We need to UNSET the field entirely, not set it to null.
 *
 * Usage: node seed/fixCertificateIdNulls.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Assessment = require("../models/Assessment");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // STEP 1: Diagnostic — count docs with null vs missing certificateId
    const total = await Assessment.collection.countDocuments({});
    const withNull = await Assessment.collection.countDocuments({ certificateId: null });
    const withMissing = await Assessment.collection.countDocuments({
      certificateId: { $exists: false },
    });
    const withValue = await Assessment.collection.countDocuments({
      certificateId: { $exists: true, $ne: null },
    });

    console.log("📊 Assessment collection state:");
    console.log(`   Total documents:                ${total}`);
    console.log(`   With certificateId: null:       ${withNull}  ← These are the problem`);
    console.log(`   With certificateId missing:     ${withMissing}`);
    console.log(`   With certificateId set:         ${withValue}`);
    console.log("");

    // STEP 2: Unset the certificateId field on all docs that have it as null
    console.log("🔧 Unsetting `certificateId: null` on affected documents...");
    const result = await Assessment.collection.updateMany(
      { certificateId: null },
      { $unset: { certificateId: "" } }
    );
    console.log(`✅ Modified ${result.modifiedCount} documents\n`);

    // STEP 3: Verify
    const stillNull = await Assessment.collection.countDocuments({ certificateId: null });
    const nowMissing = await Assessment.collection.countDocuments({
      certificateId: { $exists: false },
    });
    console.log("📊 After cleanup:");
    console.log(`   With certificateId: null:       ${stillNull}  (should be 0)`);
    console.log(`   With certificateId missing:     ${nowMissing}`);
    console.log("");

    // STEP 4: Drop and recreate the index to be safe
    console.log("🔧 Dropping and recreating certificateId index...");
    try {
      await Assessment.collection.dropIndex("certificateId_1");
      console.log("   ✅ Old index dropped");
    } catch (e) {
      console.log(`   ℹ️  Could not drop (probably doesn't exist): ${e.message}`);
    }

    await Assessment.syncIndexes();
    console.log("   ✅ Indexes synced\n");

    // STEP 5: Show final indexes
    const indexes = await Assessment.collection.indexes();
    console.log("📋 Final indexes:");
    indexes.forEach((idx) => {
      const sparse = idx.sparse ? " (sparse)" : "";
      const unique = idx.unique ? " (unique)" : "";
      const partial = idx.partialFilterExpression
        ? ` (partial: ${JSON.stringify(idx.partialFilterExpression)})`
        : "";
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}${partial}`);
    });

    await mongoose.connection.close();
    console.log("\n🎉 All clean! New assessments should now work.");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
};

run();