// server/seed/questions.seed.js

/**
 * Seed Questions
 * --------------
 * Populates the database with the 60 capability questions from the
 * Capstone Brief 2026 (Appendix 3) — 12 domains × 5 Likert questions.
 *
 * Run: node seed/questions.seed.js
 *
 * WARNING: Drops the `assessments` and `questions` collections.
 * Anyone with an in-progress or submitted assessment will lose it.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Assessment = require("../models/Assessment");
const CATEGORIES = require("../utils/categories");

// ============================================================
// 60 questions, copied verbatim from Capstone Brief Appendix 3
// (slides 1/12 through 12/12).
// All Likert 1-5. Order matches the brief's row order per domain.
// ============================================================
const questions = [
  // ============== 1. Communication & Relational Care ==============
  {
    category: "communication-relational-care",
    type: "likert",
    text: "I understand others' needs through both verbal and non-verbal communication.",
    order: 1,
  },
  {
    category: "communication-relational-care",
    type: "likert",
    text: "I adjust how I communicate based on the emotional state of others.",
    order: 2,
  },
  {
    category: "communication-relational-care",
    type: "likert",
    text: "I build trust through respectful and attentive communication.",
    order: 3,
  },
  {
    category: "communication-relational-care",
    type: "likert",
    text: "I communicate calmly during emotionally difficult situations.",
    order: 4,
  },
  {
    category: "communication-relational-care",
    type: "likert",
    text: "I communicate effectively across age, cultural, or family differences.",
    order: 5,
  },

  // ============== 2. System Navigation & Advocacy ==============
  {
    category: "system-navigation-advocacy",
    type: "likert",
    text: "I know how to navigate health, disability, or community support systems.",
    order: 1,
  },
  {
    category: "system-navigation-advocacy",
    type: "likert",
    text: "I advocate for the needs of those I care for.",
    order: 2,
  },
  {
    category: "system-navigation-advocacy",
    type: "likert",
    text: "I find and use information from reliable sources.",
    order: 3,
  },
  {
    category: "system-navigation-advocacy",
    type: "likert",
    text: "I coordinate with professionals or services on behalf of others.",
    order: 4,
  },
  {
    category: "system-navigation-advocacy",
    type: "likert",
    text: "I help others understand their rights or available services.",
    order: 5,
  },

  // ============== 3. Emotional Resilience & Self-Regulation ==============
  {
    category: "emotional-resilience-self-regulation",
    type: "likert",
    text: "I remain emotionally steady during stressful caregiving situations.",
    order: 1,
  },
  {
    category: "emotional-resilience-self-regulation",
    type: "likert",
    text: "I manage strong emotions without them affecting care quality.",
    order: 2,
  },
  {
    category: "emotional-resilience-self-regulation",
    type: "likert",
    text: "I use strategies to regulate my emotional responses.",
    order: 3,
  },
  {
    category: "emotional-resilience-self-regulation",
    type: "likert",
    text: "I recover emotionally after difficult caregiving experiences.",
    order: 4,
  },
  {
    category: "emotional-resilience-self-regulation",
    type: "likert",
    text: "I can support others emotionally while maintaining my own stability.",
    order: 5,
  },

  // ============== 4. Self-Care & Energy Management ==============
  {
    category: "self-care-energy-management",
    type: "likert",
    text: "I recognise early signs of physical or emotional fatigue in myself.",
    order: 1,
  },
  {
    category: "self-care-energy-management",
    type: "likert",
    text: "I pace my energy to sustain caregiving over time.",
    order: 2,
  },
  {
    category: "self-care-energy-management",
    type: "likert",
    text: "I take breaks before exhaustion affects safety or care.",
    order: 3,
  },
  {
    category: "self-care-energy-management",
    type: "likert",
    text: "I seek help or respite when needed.",
    order: 4,
  },
  {
    category: "self-care-energy-management",
    type: "likert",
    text: "I actively protect my own wellbeing while caring for others.",
    order: 5,
  },

  // ============== 5. Social Connection & Belonging ==============
  {
    category: "social-connection-belonging",
    type: "likert",
    text: "I maintain social connections outside my caregiving role.",
    order: 1,
  },
  {
    category: "social-connection-belonging",
    type: "likert",
    text: "I feel connected to peers, family, or community.",
    order: 2,
  },
  {
    category: "social-connection-belonging",
    type: "likert",
    text: "I seek support when feeling isolated.",
    order: 3,
  },
  {
    category: "social-connection-belonging",
    type: "likert",
    text: "I maintain interests or identity beyond caregiving.",
    order: 4,
  },
  {
    category: "social-connection-belonging",
    type: "likert",
    text: "I experience a sense of belonging rather than isolation.",
    order: 5,
  },

  // ============== 6. Group Communication & Information Filtering ==============
  {
    category: "group-communication-information-filtering",
    type: "likert",
    text: "I manage communication among multiple people involved in care.",
    order: 1,
  },
  {
    category: "group-communication-information-filtering",
    type: "likert",
    text: "I share information selectively and appropriately.",
    order: 2,
  },
  {
    category: "group-communication-information-filtering",
    type: "likert",
    text: "I reduce emotional overload in group or family settings.",
    order: 3,
  },
  {
    category: "group-communication-information-filtering",
    type: "likert",
    text: "I manage disagreements respectfully.",
    order: 4,
  },
  {
    category: "group-communication-information-filtering",
    type: "likert",
    text: "I protect others from unnecessary distressing information.",
    order: 5,
  },

  // ============== 7. Practical Care & Safety Awareness ==============
  {
    category: "practical-care-safety-awareness",
    type: "likert",
    text: "I perform daily care tasks safely and confidently.",
    order: 1,
  },
  {
    category: "practical-care-safety-awareness",
    type: "likert",
    text: "I recognise early signs of risk or deterioration.",
    order: 2,
  },
  {
    category: "practical-care-safety-awareness",
    type: "likert",
    text: "I respond effectively in unexpected or emergency situations.",
    order: 3,
  },
  {
    category: "practical-care-safety-awareness",
    type: "likert",
    text: "I manage medication or treatment routines reliably.",
    order: 4,
  },
  {
    category: "practical-care-safety-awareness",
    type: "likert",
    text: "I follow safe practices for hygiene, mobility, and infection control.",
    order: 5,
  },

  // ============== 8. Cultural, Spiritual & Ethical Practice ==============
  {
    category: "cultural-spiritual-ethical-practice",
    type: "likert",
    text: "I respect cultural, spiritual, or religious practices in caregiving.",
    order: 1,
  },
  {
    category: "cultural-spiritual-ethical-practice",
    type: "likert",
    text: "I provide care that honours individual values and traditions.",
    order: 2,
  },
  {
    category: "cultural-spiritual-ethical-practice",
    type: "likert",
    text: "I navigate ethical decisions thoughtfully.",
    order: 3,
  },
  {
    category: "cultural-spiritual-ethical-practice",
    type: "likert",
    text: "I maintain confidentiality and privacy.",
    order: 4,
  },
  {
    category: "cultural-spiritual-ethical-practice",
    type: "likert",
    text: "I respect the dignity and autonomy of those I care for.",
    order: 5,
  },

  // ============== 9. Adaptability & Learning Orientation ==============
  {
    category: "adaptability-learning-orientation",
    type: "likert",
    text: "I adjust to changes in caregiving demands.",
    order: 1,
  },
  {
    category: "adaptability-learning-orientation",
    type: "likert",
    text: "I learn new skills as caregiving needs evolve.",
    order: 2,
  },
  {
    category: "adaptability-learning-orientation",
    type: "likert",
    text: "I reflect on my own caregiving experiences.",
    order: 3,
  },
  {
    category: "adaptability-learning-orientation",
    type: "likert",
    text: "I apply lessons learned to improve future care.",
    order: 4,
  },
  {
    category: "adaptability-learning-orientation",
    type: "likert",
    text: "I remain open to new approaches and perspectives.",
    order: 5,
  },

  // ============== 10. Digital Literacy ==============
  {
    category: "digital-literacy",
    type: "likert",
    text: "I use digital tools to support caregiving tasks.",
    order: 1,
  },
  {
    category: "digital-literacy",
    type: "likert",
    text: "I manage digital records and information effectively.",
    order: 2,
  },
  {
    category: "digital-literacy",
    type: "likert",
    text: "I track appointments and care information digitally.",
    order: 3,
  },
  {
    category: "digital-literacy",
    type: "likert",
    text: "I protect privacy and confidentiality online.",
    order: 4,
  },
  {
    category: "digital-literacy",
    type: "likert",
    text: "I feel confident using care-related technology.",
    order: 5,
  },

  // ============== 11. Planning & Organisation ==============
  {
    category: "planning-organisation",
    type: "likert",
    text: "I plan caregiving tasks in advance.",
    order: 1,
  },
  {
    category: "planning-organisation",
    type: "likert",
    text: "I keep track of appointments, medications, and routines.",
    order: 2,
  },
  {
    category: "planning-organisation",
    type: "likert",
    text: "I manage time efficiently during demanding days.",
    order: 3,
  },
  {
    category: "planning-organisation",
    type: "likert",
    text: "I anticipate future caregiving needs.",
    order: 4,
  },
  {
    category: "planning-organisation",
    type: "likert",
    text: "I balance caregiving with personal responsibilities.",
    order: 5,
  },

  // ============== 12. Leadership & Coordination ==============
  {
    category: "leadership-coordination",
    type: "likert",
    text: "I coordinate caregiving tasks among others.",
    order: 1,
  },
  {
    category: "leadership-coordination",
    type: "likert",
    text: "I delegate responsibilities appropriately.",
    order: 2,
  },
  {
    category: "leadership-coordination",
    type: "likert",
    text: "I manage conflict constructively.",
    order: 3,
  },
  {
    category: "leadership-coordination",
    type: "likert",
    text: "I keep others informed about care needs.",
    order: 4,
  },
  {
    category: "leadership-coordination",
    type: "likert",
    text: "I take initiative when leadership is required.",
    order: 5,
  },
];

// ---- Run the seed ----
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Pre-flight: confirm every question's category exists in CATEGORIES
    // (catches typos before we wipe anything)
    const validKeys = new Set(Object.keys(CATEGORIES));
    const badRefs = questions.filter((q) => !validKeys.has(q.category));
    if (badRefs.length > 0) {
      console.error("❌ Seed data references unknown categories:");
      badRefs.forEach((q) => console.error(`   - "${q.category}"`));
      process.exit(1);
    }

    console.log("🧹 Clearing existing assessments and questions...");
    // Order matters: assessments reference questions, so drop them first.
    await Assessment.deleteMany({});
    await Question.deleteMany({});

    console.log(`📥 Inserting ${questions.length} questions across ${Object.keys(CATEGORIES).length} domains...`);
    await Question.insertMany(questions);

    // Verify totals
    const count = await Question.countDocuments();
    console.log(`\n✅ Done! ${count} questions in the database.`);

    if (count !== questions.length) {
      console.error(`❌ Expected ${questions.length} but got ${count} — something dropped silently.`);
      process.exit(1);
    }

    // Per-domain breakdown
    const counts = await Question.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    console.log("\n📊 Per-domain breakdown:");
    let allGood = true;
    Object.keys(CATEGORIES).forEach((key) => {
      const n = countMap[key] || 0;
      const ok = n === 5;
      if (!ok) allGood = false;
      console.log(`   ${ok ? "✓" : "✗"} ${key}: ${n}/5`);
    });

    if (!allGood) {
      console.error("\n❌ Not every domain has exactly 5 questions. Check seed data.");
      process.exit(1);
    }

    console.log("\n🎯 All 12 domains correctly seeded with 5 questions each.");

    await mongoose.connection.close();
    console.log("\n👋 Disconnected.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seed();