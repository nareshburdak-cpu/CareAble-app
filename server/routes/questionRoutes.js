/** @file Route definition for authenticated question retrieval. */
/**
 * Question Routes
 * ---------------
 *   GET /api/questions  (protected)
 */

const express = require("express");
const { getQuestions } = require("../controllers/questionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getQuestions);

module.exports = router;