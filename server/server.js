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
const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const verifyRoutes = require("./routes/verifyRoutes");

// Middleware imports
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// Initialize app
const app = express();

// ---- Global Middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ---- CORS ----
// In dev: allow anything (Vite proxy handles it anyway)
// In prod: only allow the deployed frontend URL
// ---- CORS ----
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Thunder Client, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      // Exact matches from allowedOrigins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Any Vercel preview/prod URL for this project
      if (/^https:\/\/careable.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Your custom domain (with or without www)
      if (/^https:\/\/(www\.)?careable\.site$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---- API Routes ----
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/verify", verifyRoutes);

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