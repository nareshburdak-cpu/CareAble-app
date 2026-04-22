/**
 * CareAble Backend — Entry Point
 * -------------------------------
 * Bootstraps the Express server with:
 *   - Global middleware
 *   - API routes
 *   - 404 handler
 *   - Global error handler
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

// Route imports
const healthRoutes = require("./routes/healthRoutes");

// Middleware imports
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Initialize app
const app = express();

// ---- Global Middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---- API Routes ----
app.use("/api/health", healthRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the CareAble API 🫶",
    docs: "/api/health",
  });
});

// ---- Error Handling (must come AFTER routes) ----
app.use(notFound);      // Catches unknown routes
app.use(errorHandler);  // Catches all errors

// ---- Start Server ----
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✅ CareAble server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

startServer();

// ---- Catch uncaught errors globally ----
// These catch bugs that slip past try/catch blocks.
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});