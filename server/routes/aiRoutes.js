// server/routes/aiRoutes.js

/**
 * AI Routes
 * ---------
 *   POST /api/ai/insights  — generate personalised feedback for a submitted assessment
 *
 * All routes require authentication.
 */

const express = require("express");
const { generateInsights } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/insights", generateInsights);

module.exports = router;