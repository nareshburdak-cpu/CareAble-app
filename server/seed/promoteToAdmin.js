/**
 * Promote a user to admin.
 *
 * Usage:
 *   node seed/promoteToAdmin.js <email>
 *
 * Example:
 *   node seed/promoteToAdmin.js nareshburdak25@gmail.com
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email.");
    console.error("   Usage: node seed/promoteToAdmin.js <email>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`ℹ️  ${email} is already an admin. No change.`);
      await mongoose.connection.close();
      return;
    }

    user.role = "admin";
    await user.save();

    console.log(`🎉 Promoted ${email} to admin!`);
    console.log(`   Name:  ${user.name}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`   ID:    ${user._id}`);

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
};

run();