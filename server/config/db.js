/**
 * MongoDB Connection
 * ------------------
 * Connects to MongoDB Atlas using the URI from .env
 * Exits the process if connection fails (fail-fast philosophy).
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Stop the app if DB fails
  }
};

module.exports = connectDB;