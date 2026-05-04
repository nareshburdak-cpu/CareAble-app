/**
 * Assessment Routes
 * -----------------
 *   POST   /api/assessments/start           (start or resume)
 *   GET    /api/assessments/current         (get in-progress)
 *   PATCH  /api/assessments/:id/answer      (save one answer)
 *   POST   /api/assessments/:id/submit      (finalize)
 *   GET    /api/assessments                 (list my assessments)
 *
 * All routes are protected.
 */

const express = require("express");
const {
  startAssessment,
  getCurrent,
  saveAnswer,
  deleteAnswer,
  submitAssessment,
  getAssessmentById,
  listMyAssessments,
  downloadCertificate,
  deleteAssessment,
  getCooldownStatus,
} = require("../controllers/assessmentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All assessment routes require authentication
router.use(protect);
router.get("/cooldown-status", protect, getCooldownStatus);
router.get("/", listMyAssessments);
router.get("/current", getCurrent);
router.post("/start", startAssessment);
router.get("/:id", getAssessmentById);
router.delete("/:id", deleteAssessment);
router.get("/:id/certificate", downloadCertificate);
router.patch("/:id/answer", saveAnswer);
router.delete("/:id/answer/:questionId", deleteAnswer);
router.post("/:id/submit", submitAssessment);

module.exports = router;