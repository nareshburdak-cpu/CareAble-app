/** @file Assessment lifecycle endpoints for starting, saving, submitting, and certificates. */
// server/controllers/assessmentController.js

/**
 * Assessment Controller
 * ---------------------
 *   startAssessment     (POST   /api/assessments/start)
 *   getCurrent          (GET    /api/assessments/current)
 *   saveAnswer          (PATCH  /api/assessments/:id/answer)
 *   submitAssessment    (POST   /api/assessments/:id/submit)
 *   listMyAssessments   (GET    /api/assessments)
 *
 * Phase 12-A Task 6:
 *   - startAssessment now samples N questions per active domain
 *     (N from `questionsPerCategory` setting, default 3).
 *   - The locked questionOrder/categoryOrder freezes both which
 *     questions and the order, so submitted assessments are immune
 *     to admin setting changes after the fact.
 *   - submitAssessment counts against the LOCKED question set, not
 *     the global question pool.
 *   - All endpoints expose `questionTotal` so the frontend can drop
 *     hardcoded "30 questions" strings.
 *
 * Task B (cooldown):
 *   - Cooldown duration is now driven by `assessmentCooldownHours`
 *     setting (admin-configurable). Default: 24h.
 *   - Response includes both hoursRemaining and daysRemaining so
 *     CooldownBanner can display sub-24h times accurately.
 */

const Assessment = require("../models/Assessment");
const Question = require("../models/Question");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { calculateScores } = require("../utils/scoring");
const generateCertificate = require("../utils/generateCertificate");
const { customAlphabet } = require("nanoid");
const { shuffle } = require("../utils/shuffle");
const categoryCache = require("../utils/categoryCache");
const { getSetting } = require("../utils/settings");
const { sendEmail } = require("../utils/sendEmail");
const { assessmentCertificateEmail } = require("../utils/emailTemplates");

// Readable alphabet: no confusing chars (no 0/O, 1/I/l, etc.)
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoid = customAlphabet(ID_ALPHABET, 10);
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Count the number of questions LOCKED into a specific assessment's
 * question order. Falls back to 0 if the assessment has no locked order.
 */
function lockedQuestionCount(assessment) {
  if (!assessment?.questionOrder) return 0;
  let count = 0;
  for (const ids of assessment.questionOrder.values()) {
    count += ids.length;
  }
  return count;
}

/**
 * Get all question IDs locked in this assessment, flattened.
 */
function lockedQuestionIds(assessment) {
  if (!assessment?.questionOrder) return [];
  const ids = [];
  for (const arr of assessment.questionOrder.values()) {
    ids.push(...arr);
  }
  return ids;
}

/**
 * Build the cooldown payload from a submitted assessment + cooldown hours.
 * Centralised here so startAssessment and getCooldownStatus stay in sync.
 */
function buildCooldownPayload(submittedAt, cooldownHours) {
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const nextAvailable = new Date(submittedAt.getTime() + cooldownMs);
  const msRemaining = nextAvailable - Date.now();
  const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return {
    active: true,
    cooldownHours,
    lastSubmittedAt: submittedAt.toISOString(),
    nextAvailableAt: nextAvailable.toISOString(),
    hoursRemaining,
    daysRemaining,
  };
}

async function buildAssessmentExpiryDate(from = new Date()) {
  const expiryDays = await getSetting("inProgressAssessmentExpiryDays");
  return new Date(from.getTime() + expiryDays * DAY_MS);
}

function isExpiredInProgress(assessment) {
  return (
    assessment?.status === "in-progress" &&
    assessment.expiresAt &&
    assessment.expiresAt.getTime() <= Date.now()
  );
}

async function deleteExpiredInProgressForUser(userId) {
  const expiryDays = await getSetting("inProgressAssessmentExpiryDays");
  const legacyExpiryStart = new Date(Date.now() - expiryDays * DAY_MS);
  const result = await Assessment.deleteMany({
    user: userId,
    status: "in-progress",
    $or: [
      { expiresAt: { $lte: new Date() } },
      { expiresAt: { $exists: false }, createdAt: { $lte: legacyExpiryStart } },
      { expiresAt: null, createdAt: { $lte: legacyExpiryStart } },
    ],
  });
  return result.deletedCount || 0;
}

async function ensureActiveInProgress(assessment) {
  if (!isExpiredInProgress(assessment)) return assessment;

  await Assessment.findByIdAndDelete(assessment._id);
  throw new ApiError(
    410,
    "This in-progress assessment has expired. Please start a new assessment to get the latest questions.",
    { expiredAssessment: true }
  );
}

// ── Endpoints ──────────────────────────────────────────────────────

/**
 * @desc    Start a new assessment (or return existing in-progress one)
 * @route   POST /api/assessments/start
 * @access  Private
 */
function buildClientUrl(path) {
  const base = (process.env.CLIENT_URL || "https://careable.site").replace(/\/$/, "");
  return `${base}${path}`;
}

async function sendCertificateEmail(user, assessment) {
  if (!user?.email) return;

  try {
    const pdfBuffer = await generateCertificate(user, assessment);
    const verifyUrl = buildClientUrl(`/verify/${encodeURIComponent(assessment.certificateId)}`);
    const resultsUrl = buildClientUrl(`/results/${assessment._id}`);
    const { subject, html } = assessmentCertificateEmail({
      name: user.name,
      assessment,
      verifyUrl,
      resultsUrl,
    });

    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      attachments: [
        {
          filename: `CareAble_Certificate_${assessment.certificateId || "certificate"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!result.success) {
      console.error("[CERT EMAIL] Send failed:", result.error);
    }
  } catch (err) {
    console.error("[CERT EMAIL] Could not send certificate email:", err.message);
  }
}

const startAssessment = asyncHandler(async (req, res) => {
  let expiredDeletedCount = await deleteExpiredInProgressForUser(req.user._id);

  // STEP 0: Cooldown check (only if no in-progress to resume)
  const hasInProgress = await Assessment.exists({
    user: req.user._id,
    status: "in-progress",
  });

  if (!hasInProgress) {
    const cooldownHours = await getSetting("assessmentCooldownHours");
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const cooldownStart = new Date(Date.now() - cooldownMs);

    const recentSubmission = await Assessment.findOne({
      user: req.user._id,
      status: "submitted",
      submittedAt: { $gte: cooldownStart },
    })
      .sort({ submittedAt: -1 })
      .lean();

    if (recentSubmission) {
      const payload = buildCooldownPayload(
        new Date(recentSubmission.submittedAt),
        cooldownHours
      );
      throw new ApiError(
        429,
        `Please wait ${payload.hoursRemaining} more hour${payload.hoursRemaining === 1 ? "" : "s"} before retaking. This helps keep results meaningful.`,
        { cooldown: payload }
      );
    }
  }

  // STEP 1: Find existing in-progress, dedupe duplicates
  const allInProgress = await Assessment.find({
    user: req.user._id,
    status: "in-progress",
  }).sort({ updatedAt: -1 });

  let assessment = null;

  if (allInProgress.length > 0) {
    assessment = allInProgress[0];
    if (allInProgress.length > 1) {
      const extraIds = allInProgress.slice(1).map((a) => a._id);
      await Assessment.deleteMany({ _id: { $in: extraIds } });
    }
  }

  if (assessment && !assessment.expiresAt) {
    assessment.expiresAt = await buildAssessmentExpiryDate(assessment.createdAt || new Date());
    await assessment.save();
  }

  if (isExpiredInProgress(assessment)) {
    await Assessment.findByIdAndDelete(assessment._id);
    expiredDeletedCount += 1;
    assessment = null;
  }

  if (!assessment) {
    const cooldownHours = await getSetting("assessmentCooldownHours");
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const cooldownStart = new Date(Date.now() - cooldownMs);

    const recentSubmission = await Assessment.findOne({
      user: req.user._id,
      status: "submitted",
      submittedAt: { $gte: cooldownStart },
    })
      .sort({ submittedAt: -1 })
      .lean();

    if (recentSubmission) {
      const payload = buildCooldownPayload(
        new Date(recentSubmission.submittedAt),
        cooldownHours
      );
      throw new ApiError(
        429,
        `Please wait ${payload.hoursRemaining} more hour${payload.hoursRemaining === 1 ? "" : "s"} before retaking. This helps keep results meaningful.`,
        { cooldown: payload }
      );
    }
  }

  // STEP 2: Create new if needed
  if (!assessment) {
    try {
      assessment = await Assessment.create({
        user: req.user._id,
        status: "in-progress",
        answers: new Map(),
        expiresAt: await buildAssessmentExpiryDate(),
      });
    } catch (err) {
      if (err.code === 11000) {
        assessment = await Assessment.findOne({
          user: req.user._id,
          status: "in-progress",
        });
      } else {
        throw err;
      }
    }
  }

  if (!assessment) {
    throw new ApiError(500, "Could not start assessment. Please try again in a moment.");
  }

  // STEP 3: Lock question set if not already locked.
  if (assessment.categoryOrder.length === 0) {
    const questionsPerCategory = await getSetting("questionsPerCategory");

    const activeCategories = await categoryCache.getCategories();
    const activeKeys = activeCategories.map((c) => c.key);

    const allQuestions = await Question.find({
      isArchived: { $ne: true },
      category: { $in: activeKeys },
    }).lean();

    const byCategory = {};
    for (const q of allQuestions) {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q);
    }

    const questionOrderMap = {};
    const populatedCategories = [];

    for (const cat of activeKeys) {
      const pool = byCategory[cat] || [];
      if (pool.length === 0) continue;

      const shuffledPool = shuffle(pool);
      const sampleSize = Math.min(questionsPerCategory, pool.length);
      const sample = shuffledPool.slice(0, sampleSize);

      questionOrderMap[cat] = sample.map((q) => q._id.toString());
      populatedCategories.push(cat);
    }

    const shuffledCategoryOrder = shuffle(populatedCategories);

    assessment.categoryOrder = shuffledCategoryOrder;
    assessment.questionOrder = questionOrderMap;
    await assessment.save();
  }

  const totalQuestions = lockedQuestionCount(assessment);

  res.status(200).json({
    success: true,
    data: {
      assessment,
      progress: {
        answered: assessment.answers.size,
        total: totalQuestions,
        percent: totalQuestions > 0
          ? Math.round((assessment.answers.size / totalQuestions) * 100)
          : 0,
      },
      questionTotal: totalQuestions,
      expiredDraftDeleted: expiredDeletedCount > 0,
    },
  });
});

/**
 * @desc    Get the user's current in-progress assessment
 * @route   GET /api/assessments/current
 * @access  Private
 */
const getCurrent = asyncHandler(async (req, res) => {
  const expiredDeletedCount = await deleteExpiredInProgressForUser(req.user._id);

  const assessment = await Assessment.findOne({
    user: req.user._id,
    status: "in-progress",
  });

  const totalQuestions = assessment ? lockedQuestionCount(assessment) : 0;

  res.status(200).json({
    success: true,
    data: {
      assessment,
      progress: {
        answered: assessment ? assessment.answers.size : 0,
        total: totalQuestions,
        percent: assessment && totalQuestions > 0
          ? Math.round((assessment.answers.size / totalQuestions) * 100)
          : 0,
      },
      questionTotal: totalQuestions,
      expiredDraftDeleted: expiredDeletedCount > 0,
    },
  });
});

/**
 * @desc    Save or update a single answer (auto-save)
 * @route   PATCH /api/assessments/:id/answer
 * @access  Private
 */
const saveAnswer = asyncHandler(async (req, res) => {
  const { questionId, value, values } = req.body;

  if (!questionId) {
    throw new ApiError(400, "questionId is required");
  }

  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(400, "This assessment has already been submitted");
  }
  await ensureActiveInProgress(assessment);

  const lockedIds = new Set(lockedQuestionIds(assessment));
  if (!lockedIds.has(questionId)) {
    throw new ApiError(400, "This question is not part of your current assessment");
  }

  const question = await Question.findById(questionId);
  if (!question) throw new ApiError(404, "Question not found");

  const answerPayload = { answeredAt: new Date() };

  if (question.type === "multi") {
    if (!Array.isArray(values)) {
      throw new ApiError(400, "Multi-select questions require `values` (array)");
    }
    answerPayload.values = values;
  } else {
    if (value === undefined || value === null || value === "") {
      throw new ApiError(400, "This question type requires `value`");
    }
    answerPayload.value = String(value);
  }

  assessment.answers.set(questionId, answerPayload);
  await assessment.save();

  const totalQuestions = lockedQuestionCount(assessment);

  res.status(200).json({
    success: true,
    message: "Answer saved",
    data: {
      answered: assessment.answers.size,
      total: totalQuestions,
      percent: Math.round((assessment.answers.size / totalQuestions) * 100),
    },
  });
});

/**
 * @desc    Submit the assessment — scoring happens here
 * @route   POST /api/assessments/:id/submit
 * @access  Private
 */
const submitAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(400, "This assessment has already been submitted");
  }
  await ensureActiveInProgress(assessment);
  if (!req.user.emailVerified) {
    throw new ApiError(
      403,
      "Please verify your email before submitting. Check your inbox or request a new verification link."
    );
  }

  const lockedIds = lockedQuestionIds(assessment);
  const totalLocked = lockedIds.length;

  if (totalLocked === 0) {
    throw new ApiError(500, "Assessment has no questions locked. Please discard and start again.");
  }

  if (assessment.answers.size < totalLocked) {
    throw new ApiError(
      400,
      `You have answered ${assessment.answers.size} of ${totalLocked} questions. Please answer all questions before submitting.`
    );
  }

  const questions = await Question.find({
    _id: { $in: lockedIds },
  }).lean();

  const { categoryScores, overallScore, level } = calculateScores(
    assessment.answers,
    questions
  );

  const year = new Date().getFullYear();
  let certificateId;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 5) {
    const candidate = `CA-${year}-${nanoid(6)}`;
    const existing = await Assessment.findOne({ certificateId: candidate });
    if (!existing) {
      certificateId = candidate;
      isUnique = true;
    }
    attempts++;
  }
  if (!certificateId) {
    throw new ApiError(500, "Could not generate unique certificate ID");
  }

  assessment.status = "submitted";
  assessment.submittedAt = new Date();
  assessment.expiresAt = undefined;
  assessment.categoryScores = categoryScores;
  assessment.overallScore = overallScore;
  assessment.level = level;
  assessment.certificateId = certificateId;

  const answersArray = Array.from(assessment.answers.values());
  if (answersArray.length >= 2) {
    const timestamps = answersArray
      .map((a) => a.answeredAt?.getTime())
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (timestamps.length >= 2) {
      // Cap each inter-answer gap at 2 minutes to exclude idle time.
      // Without this, a user who pauses mid-assessment inflates the total.
      const MAX_GAP_MS = 2 * 60 * 1000; // 2 minutes per question max
      let activeMs = 0;
      for (let i = 1; i < timestamps.length; i++) {
        const gap = timestamps[i] - timestamps[i - 1];
        activeMs += Math.min(gap, MAX_GAP_MS);
      }

      const avgSecPerQuestion = activeMs / 1000 / answersArray.length;

      assessment.completionTimeMs = activeMs;
      assessment.avgSecPerQuestion = Math.round(avgSecPerQuestion);
      assessment.rushed = avgSecPerQuestion < 4;
    }
  }

  await assessment.save();

  req.user.hasCompletedAssessment = true;
  await req.user.save();

  await sendCertificateEmail(req.user, assessment);

  res.status(200).json({
    success: true,
    message: "Assessment submitted 🎉",
    data: { assessment },
  });
});

/**
 * @desc    Get a specific assessment by ID (with results)
 * @route   GET /api/assessments/:id
 * @access  Private
 */
const getAssessmentById = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "in-progress") {
    await ensureActiveInProgress(assessment);
  }

  res.status(200).json({
    success: true,
    data: { assessment },
  });
});

/**
 * @desc    List all of the user's assessments (newest first)
 * @route   GET /api/assessments
 * @access  Private
 */
const listMyAssessments = asyncHandler(async (req, res) => {
  await deleteExpiredInProgressForUser(req.user._id);

  const docs = await Assessment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  const assessments = docs.map((a) => {
    const answerCount = a.answers ? Object.keys(a.answers).length : 0;

    let questionTotal = 0;
    if (a.questionOrder) {
      for (const arr of Object.values(a.questionOrder)) {
        if (Array.isArray(arr)) questionTotal += arr.length;
      }
    }

    delete a.answers;
    delete a.questionOrder;

    return {
      ...a,
      answerCount,
      questionTotal,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      count: assessments.length,
      assessments,
    },
  });
});

/**
 * @desc    Delete a single answer (user cleared it)
 * @route   DELETE /api/assessments/:id/answer/:questionId
 * @access  Private
 */
const deleteAnswer = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;

  const assessment = await Assessment.findById(id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(400, "This assessment has already been submitted");
  }
  await ensureActiveInProgress(assessment);

  assessment.answers.delete(questionId);
  await assessment.save();

  const totalQuestions = lockedQuestionCount(assessment);

  res.status(200).json({
    success: true,
    message: "Answer cleared",
    data: {
      answered: assessment.answers.size,
      total: totalQuestions,
      percent: Math.round((assessment.answers.size / totalQuestions) * 100),
    },
  });
});

/**
 * @desc    Download a PDF certificate for a submitted assessment
 * @route   GET /api/assessments/:id/certificate
 * @access  Private
 */
const downloadCertificate = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status !== "submitted") {
    throw new ApiError(400, "Certificate only available for submitted assessments");
  }

  const pdfBuffer = await generateCertificate(req.user, assessment);

  const filename = `CareAble_Certificate_${assessment.certificateId || "unknown"}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  res.send(pdfBuffer);
});

/**
 * @desc    Delete an in-progress assessment
 * @route   DELETE /api/assessments/:id
 * @access  Private
 */
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(
      400,
      "Submitted assessments cannot be deleted. They're a permanent record of your skills."
    );
  }
  await ensureActiveInProgress(assessment);

  await Assessment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Assessment discarded. You can start fresh anytime.",
  });
});

/**
 * @desc    Check if user is in retake cooldown
 * @route   GET /api/assessments/cooldown-status
 * @access  Private
 */
const getCooldownStatus = asyncHandler(async (req, res) => {
  await deleteExpiredInProgressForUser(req.user._id);

  const cooldownHours = await getSetting("assessmentCooldownHours");
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const cooldownStart = new Date(Date.now() - cooldownMs);

  const hasInProgress = await Assessment.exists({
    user: req.user._id,
    status: "in-progress",
  });

  if (hasInProgress) {
    return res.status(200).json({
      success: true,
      data: {
        cooldown: {
          active: false,
          cooldownHours,
          hasInProgress: true,
        },
      },
    });
  }

  const recentSubmission = await Assessment.findOne({
    user: req.user._id,
    status: "submitted",
    submittedAt: { $gte: cooldownStart },
  })
    .sort({ submittedAt: -1 })
    .lean();

  if (!recentSubmission) {
    return res.status(200).json({
      success: true,
      data: {
        cooldown: {
          active: false,
          cooldownHours,
        },
      },
    });
  }

  const payload = buildCooldownPayload(
    new Date(recentSubmission.submittedAt),
    cooldownHours
  );

  res.status(200).json({
    success: true,
    data: { cooldown: payload },
  });
});

module.exports = {
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
};
