// server/seed/categories.seed.js

/**
 * Seed Categories
 * ---------------
 * One-off migration. Reads the canonical 12 capability domains from
 * server/utils/categories.js and upserts them into the Category collection.
 *
 * IDEMPOTENT — safe to re-run. Uses $setOnInsert for admin-editable fields
 * (label, description, icon, color) so re-running won't undo admin edits.
 * Uses $set for key + order to keep them canonical.
 *
 * Run: node seed/categories.seed.js
 *
 * Does NOT delete anything. Add-or-update only.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const CATEGORIES = require("../utils/categories");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const entries = Object.entries(CATEGORIES);
    console.log(`📥 Upserting ${entries.length} categories...\n`);

    let created = 0;
    let updatedOrder = 0;
    let unchanged = 0;

    for (let i = 0; i < entries.length; i++) {
      const [key, meta] = entries[i];
      const order = i; // 0-indexed, matches brief order

      // Detect whether this category already exists, so we can report properly
      const existing = await Category.findOne({ key }).lean();

      const result = await Category.findOneAndUpdate(
        { key },
        {
          $set: {
            // Always canonical — re-seed wins for these
            key,
            order,
          },
          $setOnInsert: {
            // Only set on first insert — preserves admin edits on re-seed
            label: meta.label,
            description: meta.description,
            icon: meta.icon,
            color: meta.color,
            isArchived: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (!existing) {
        created++;
        console.log(`   ✓ Created: ${key} → "${meta.label}"`);
      } else if (existing.order !== order) {
        updatedOrder++;
        console.log(`   ↻ Reordered: ${key} (${existing.order} → ${order})`);
      } else {
        unchanged++;
      }

      // Defensive: result should never be null after upsert with new: true
      if (!result) {
        throw new Error(`Upsert returned null for ${key}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created:        ${created}`);
    console.log(`   Reordered:      ${updatedOrder}`);
    console.log(`   Unchanged:      ${unchanged}`);

    // Final verification
    const total = await Category.countDocuments();
    const active = await Category.countDocuments({ isArchived: false });
    console.log(`\n✅ Total in DB:    ${total}`);
    console.log(`   Active:         ${active}`);
    console.log(`   Archived:       ${total - active}`);

    await mongoose.connection.close();
    console.log("\n👋 Disconnected.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seed();