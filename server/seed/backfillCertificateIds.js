/**
 * Backfill Certificate IDs
 * ------------------------
 * Assigns certificate IDs to submitted assessments that don't have one.
 *
 * Run: node seed/backfillCertificateIds.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");
const Assessment = require("../models/Assessment");

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoid = customAlphabet(ID_ALPHABET, 6);

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const toBackfill = await Assessment.find({
      status: "submitted",
      $or: [{ certificateId: null }, { certificateId: { $exists: false } }],
    });

    console.log(`📋 Found ${toBackfill.length} submitted assessment(s) without certificate IDs`);

    for (const a of toBackfill) {
      const year = new Date(a.submittedAt || a.updatedAt).getFullYear();
      let id;
      let unique = false;
      while (!unique) {
        const candidate = `CA-${year}-${nanoid()}`;
        const existing = await Assessment.findOne({ certificateId: candidate });
        if (!existing) {
          id = candidate;
          unique = true;
        }
      }
      a.certificateId = id;
      await a.save();
      console.log(`   ✓ ${a._id} → ${id}`);
    }

    console.log("\n🎉 Done!");
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  }
};

run();