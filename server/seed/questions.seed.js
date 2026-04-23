/**
 * Seed Questions
 * --------------
 * Populates the database with 30 mock questions (6 categories × 5 questions).
 *
 * Run: node seed/questions.seed.js
 *
 * WARNING: Deletes all existing questions and replaces them.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");

// ---- Reusable option sets ----
const FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "always", label: "Always" },
];

// ---- 30 mock questions ----
const questions = [
  // ============== PERSONAL CARE ==============
  {
    category: "personal-care",
    type: "likert",
    text: "I feel confident helping with bathing, dressing, and grooming.",
    helper: "Think about how comfortable you feel assisting with intimate tasks.",
    order: 1,
  },
  {
    category: "personal-care",
    type: "frequency",
    text: "How often do you help with mobility or transfers?",
    helper: "E.g. moving from bed to chair, walking support.",
    options: FREQUENCY_OPTIONS,
    order: 2,
  },
  {
    category: "personal-care",
    type: "likert",
    text: "I know how to safely support someone who has difficulty walking.",
    order: 3,
  },
  {
    category: "personal-care",
    type: "multi",
    text: "Which personal care tasks do you regularly provide?",
    helper: "Select all that apply.",
    options: [
      { value: "bathing", label: "Bathing & hygiene" },
      { value: "dressing", label: "Dressing" },
      { value: "grooming", label: "Grooming (hair, nails)" },
      { value: "toileting", label: "Toileting & continence" },
      { value: "feeding", label: "Feeding" },
      { value: "mobility", label: "Mobility support" },
    ],
    order: 4,
  },
  {
    category: "personal-care",
    type: "likert",
    text: "I know how to preserve dignity and privacy during personal care.",
    order: 5,
  },

  // ============== HEALTH MANAGEMENT ==============
  {
    category: "health-management",
    type: "likert",
    text: "I can confidently manage medications, including timing and dosage.",
    helper: "E.g. organising pill boxes, tracking schedules.",
    order: 1,
  },
  {
    category: "health-management",
    type: "frequency",
    text: "How often do you attend medical appointments with the person you care for?",
    options: FREQUENCY_OPTIONS,
    order: 2,
  },
  {
    category: "health-management",
    type: "likert",
    text: "I can recognise when symptoms are changing and know when to seek help.",
    order: 3,
  },
  {
    category: "health-management",
    type: "multi",
    text: "Which health-related tasks do you handle?",
    options: [
      { value: "medications", label: "Administering medications" },
      { value: "appointments", label: "Scheduling appointments" },
      { value: "vitals", label: "Monitoring vital signs" },
      { value: "wounds", label: "Wound or skin care" },
      { value: "diet", label: "Managing special diets" },
      { value: "equipment", label: "Operating medical equipment" },
    ],
    order: 4,
  },
  {
    category: "health-management",
    type: "likert",
    text: "I feel prepared to handle a medical emergency.",
    order: 5,
  },

  // ============== EMOTIONAL SUPPORT ==============
  {
    category: "emotional-support",
    type: "likert",
    text: "I am a good listener when the person I care for wants to talk about their feelings.",
    order: 1,
  },
  {
    category: "emotional-support",
    type: "frequency",
    text: "How often do you help the person you care for manage difficult emotions?",
    options: FREQUENCY_OPTIONS,
    order: 2,
  },
  {
    category: "emotional-support",
    type: "likert",
    text: "I recognise signs of depression, anxiety, or distress.",
    order: 3,
  },
  {
    category: "emotional-support",
    type: "multi",
    text: "Which emotional support activities do you commonly provide?",
    options: [
      { value: "listening", label: "Active listening" },
      { value: "company", label: "Companionship" },
      { value: "activities", label: "Meaningful activities / hobbies" },
      { value: "reassurance", label: "Reassurance during distress" },
      { value: "connection", label: "Keeping them connected with friends/family" },
      { value: "memories", label: "Reminiscence & storytelling" },
    ],
    order: 4,
  },
  {
    category: "emotional-support",
    type: "likert",
    text: "I know how to stay calm when the person I care for is upset or agitated.",
    order: 5,
  },

  // ============== HOUSEHOLD TASKS ==============
  {
    category: "household-tasks",
    type: "likert",
    text: "I regularly prepare meals that meet the care recipient's dietary needs.",
    order: 1,
  },
  {
    category: "household-tasks",
    type: "frequency",
    text: "How often do you do the grocery shopping for the person you care for?",
    options: FREQUENCY_OPTIONS,
    order: 2,
  },
  {
    category: "household-tasks",
    type: "likert",
    text: "I ensure the home environment is safe and accessible.",
    helper: "E.g. removing trip hazards, ensuring good lighting.",
    order: 3,
  },
  {
    category: "household-tasks",
    type: "multi",
    text: "Which household tasks do you regularly handle?",
    options: [
      { value: "cooking", label: "Meal preparation" },
      { value: "shopping", label: "Grocery shopping" },
      { value: "cleaning", label: "Cleaning & laundry" },
      { value: "bills", label: "Paying bills & admin" },
      { value: "transport", label: "Driving & transport" },
      { value: "repairs", label: "Home repairs & maintenance" },
    ],
    order: 4,
  },
  {
    category: "household-tasks",
    type: "likert",
    text: "I can manage a household budget for care-related expenses.",
    order: 5,
  },

  // ============== NAVIGATION & ADVOCACY ==============
  {
    category: "navigation-advocacy",
    type: "likert",
    text: "I understand how to navigate the aged care, disability, or health systems.",
    order: 1,
  },
  {
    category: "navigation-advocacy",
    type: "frequency",
    text: "How often do you advocate for the person you care for with service providers?",
    options: FREQUENCY_OPTIONS,
    order: 2,
  },
  {
    category: "navigation-advocacy",
    type: "likert",
    text: "I can ask healthcare professionals the right questions to get clear answers.",
    order: 3,
  },
  {
    category: "navigation-advocacy",
    type: "multi",
    text: "Which systems have you dealt with in your caregiving role?",
    options: [
      { value: "ndis", label: "NDIS" },
      { value: "aged-care", label: "My Aged Care" },
      { value: "medicare", label: "Medicare & PBS" },
      { value: "hospitals", label: "Hospitals & specialists" },
      { value: "insurance", label: "Private health insurance" },
      { value: "centrelink", label: "Centrelink & carer payments" },
    ],
    order: 4,
  },
  {
    category: "navigation-advocacy",
    type: "likert",
    text: "I keep organised records (appointments, medications, documents).",
    order: 5,
  },

  // ============== SELF-CARE & RESILIENCE ==============
  {
    category: "self-care-resilience",
    type: "likert",
    text: "I recognise when I am feeling overwhelmed or burnt out.",
    order: 1,
  },
  {
    category: "self-care-resilience",
    type: "frequency",
    text: "How often do you take time for yourself — hobbies, rest, social connection?",
    options: FREQUENCY_OPTIONS,
    order: 2,
  },
  {
    category: "self-care-resilience",
    type: "likert",
    text: "I feel comfortable asking for help or respite when I need it.",
    order: 3,
  },
  {
    category: "self-care-resilience",
    type: "multi",
    text: "Which self-care practices do you use?",
    options: [
      { value: "exercise", label: "Regular exercise" },
      { value: "sleep", label: "Good sleep routine" },
      { value: "social", label: "Social connection" },
      { value: "hobbies", label: "Personal hobbies" },
      { value: "professional", label: "Professional support (therapy, counselling)" },
      { value: "respite", label: "Respite care" },
    ],
    order: 4,
  },
  {
    category: "self-care-resilience",
    type: "likert",
    text: "I have at least one trusted person I can talk to about my caregiving experience.",
    order: 5,
  },
];

// ---- Run the seed ----
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🧹 Clearing existing questions...");
    await Question.deleteMany({});

    console.log(`📥 Inserting ${questions.length} questions...`);
    await Question.insertMany(questions);

    // Verify
    const count = await Question.countDocuments();
    console.log(`✅ Done! ${count} questions in the database.`);

    // Show breakdown by category
    const counts = await Question.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    console.log("\n📊 Breakdown by category:");
    counts.forEach((c) => console.log(`   ${c._id}: ${c.count}`));

    await mongoose.connection.close();
    console.log("\n👋 Disconnected.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seed();