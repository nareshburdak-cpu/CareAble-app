/**
 * Backfill: Generate randomized question/category order for assessments
 * created BEFORE the randomization feature was added.
 *
 * Usage: node seed/backfillQuestionOrder.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Assessment = require("../models/Assessment");
const Question = require("../models/Question");
const { shuffle } = require("../utils/shuffle");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const allQuestions = await Question.find().lean();
    const byCategory = {};
    for (const q of allQuestions) {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q);
    }

    // Find all assessments missing categoryOrder
    const assessments = await Assessment.find({
      $or: [
        { categoryOrder: { $exists: false } },
        { categoryOrder: { $size: 0 } },
      ],
    });

    console.log(`📋 Found ${assessments.length} assessment(s) without order\n`);

    let updated = 0;
    for (const a of assessments) {
      const categoryKeys = Object.keys(byCategory);
      const shuffledCategoryOrder = shuffle(categoryKeys);

      const questionOrderMap = {};
      for (const cat of shuffledCategoryOrder) {
        const shuffledQs = shuffle(byCategory[cat]);
        questionOrderMap[cat] = shuffledQs.map((q) => q._id.toString());
      }

      a.categoryOrder = shuffledCategoryOrder;
      a.questionOrder = questionOrderMap;
      await a.save();
      updated++;
    }

    console.log(`✅ Updated ${updated} assessment(s) with randomized order`);
    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  }
};

run();