/**
 * Assessment Controller
 * ---------------------
 *   startAssessment     (POST   /api/assessments/start)
 *   getCurrent          (GET    /api/assessments/current)
 *   saveAnswer          (PATCH  /api/assessments/:id/answer)
 *   submitAssessment    (POST   /api/assessments/:id/submit)
 *   listMyAssessments   (GET    /api/assessments)
 */

const Assessment = require("../models/Assessment");
const Question = require("../models/Question");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { calculateScores } = require("../utils/scoring");
const generateCertificate = require("../utils/generateCertificate");
const { customAlphabet } = require("nanoid");
const { shuffle } = require("../utils/shuffle");
// Readable alphabet: no confusing chars (no 0/O, 1/I/l, etc.)
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoid = customAlphabet(ID_ALPHABET, 10);
const categoryCache = require("../utils/categoryCache");


/**
 * @desc    Start a new assessment (or return existing in-progress one)
 * @route   POST /api/assessments/start
 * @access  Private
 *
 * Strategy:
 * 1. Look for existing in-progress assessment → return it
 * 2. If found and there are duplicates → keep newest, delete the rest
 * 3. If none found → create one (handles race condition with try/catch)
 *
 * Defense in depth: frontend ref guard + this logic + DB partial unique index
 */
const COOLDOWN_DAYS = 1;

async function scoredQuestionCount() {
  return Question.countDocuments({
    isArchived: { $ne: true },
    type: { $ne: "multi" },
  });
}

const startAssessment = asyncHandler(async (req, res) => {
  //  STEP 0: Check cooldown — but only if user has no in-progress assessment.
  // Otherwise resuming would be wrongly blocked.
  const hasInProgress = await Assessment.exists({
    user: req.user._id,
    status: "in-progress",
  });

  if (!hasInProgress) {
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const cooldownStart = new Date(Date.now() - cooldownMs);

    const recentSubmission = await Assessment.findOne({
      user: req.user._id,
      status: "submitted",
      submittedAt: { $gte: cooldownStart },
    })
      .sort({ submittedAt: -1 })
      .lean();

    if (recentSubmission) {
      const submittedAt = new Date(recentSubmission.submittedAt);
      const nextAvailable = new Date(submittedAt.getTime() + cooldownMs);
      const daysRemaining = Math.ceil(
        (nextAvailable - Date.now()) / (24 * 60 * 60 * 1000)
      );

      // Throw a structured 429 with cooldown metadata
      throw new ApiError(
        429,
        `Please wait ${daysRemaining} more day(s) before retaking. This helps keep results meaningful.`,
        {
          cooldown: {
            active: true,
            cooldownDays: COOLDOWN_DAYS,
            lastSubmittedAt: submittedAt.toISOString(),
            nextAvailableAt: nextAvailable.toISOString(),
            daysRemaining,
          },
        }
      );
    }
  }

  // STEP 1: Find ALL in-progress assessments for this user
  const allInProgress = await Assessment.find({
    user: req.user._id,
    status: "in-progress",
  }).sort({ updatedAt: -1 });

  let assessment = null;

  // STEP 2: If duplicates exist, keep the newest, delete the rest
  if (allInProgress.length > 0) {
    assessment = allInProgress[0];
    if (allInProgress.length > 1) {
      const extraIds = allInProgress.slice(1).map((a) => a._id);
      await Assessment.deleteMany({ _id: { $in: extraIds } });
    }
  }

  // STEP 3: No existing in-progress → create one
  if (!assessment) {
    try {
      assessment = await Assessment.create({
        user: req.user._id,
        status: "in-progress",
        answers: new Map(),
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

  // STEP 4: Generate randomized order if not already set
  if (assessment.categoryOrder.length === 0) {
    const activeCategories = await categoryCache.getCategories(); // add this import if not present
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

    const categoryKeys = Object.keys(byCategory);
    const shuffledCategoryOrder = shuffle(categoryKeys);

    const questionOrderMap = {};
    for (const cat of shuffledCategoryOrder) {
      const shuffledQs = shuffle(byCategory[cat]);
      questionOrderMap[cat] = shuffledQs.map((q) => q._id.toString());
    }

    assessment.categoryOrder = shuffledCategoryOrder;
    assessment.questionOrder = questionOrderMap;
    await assessment.save();
  }

  const totalQuestions = await scoredQuestionCount();

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
    },
  });
});
/**
 * @desc    Get the user's current in-progress assessment
 * @route   GET /api/assessments/current
 * @access  Private
 */
const getCurrent = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findOne({
    user: req.user._id,
    status: "in-progress",
  });

  const totalQuestions = await scoredQuestionCount();

  res.status(200).json({
    success: true,
    data: {
      assessment, // may be null — that's fine
      progress: {
        answered: assessment ? assessment.answers.size : 0,
        total: totalQuestions,
        percent: assessment
          ? Math.round((assessment.answers.size / totalQuestions) * 100)
          : 0,
      },
    },
  });
});

/**
 * @desc    Save or update a single answer (auto-save)
 * @route   PATCH /api/assessments/:id/answer
 * @access  Private
 *
 * Body: { questionId, value?, values? }
 */
const saveAnswer = asyncHandler(async (req, res) => {
  const { questionId, value, values } = req.body;

  if (!questionId) {
    throw new ApiError(400, "questionId is required");
  }

  // Find the assessment and verify ownership
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) {
    throw new ApiError(404, "Assessment not found");
  }
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(400, "This assessment has already been submitted");
  }

  // Verify the question exists and the answer matches its type
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  const answerPayload = { answeredAt: new Date() };

  if (question.type === "multi") {
    if (!Array.isArray(values)) {
      throw new ApiError(400, "Multi-select questions require `values` (array)");
    }
    answerPayload.values = values;
  } else {
    // likert or frequency
    if (value === undefined || value === null || value === "") {
      throw new ApiError(400, "This question type requires `value`");
    }
    answerPayload.value = String(value);
  }

  // Save the answer
  assessment.answers.set(questionId, answerPayload);
  await assessment.save();

  const totalQuestions = await scoredQuestionCount();

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
 * @desc    Submit the assessment — scoring happens here (Task 6)
 * @route   POST /api/assessments/:id/submit
 * @access  Private
 */

const submitAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) {
    throw new ApiError(404, "Assessment not found");
  }
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(400, "This assessment has already been submitted");
  }
  if (!req.user.emailVerified) {
      throw new ApiError(403,"Please verify your email before submitting. Check your inbox or request a new verification link.");
    }


  const activeCategories = await categoryCache.getCategories();
  const activeKeys = activeCategories.map((c) => c.key);
  const questions = await Question.find({
    isArchived: { $ne: true },
    category: { $in: activeKeys },
  }).lean();

  if (assessment.answers.size < questions.length) {
    throw new ApiError(
      400,
      `You have answered ${assessment.answers.size} of ${questions.length} questions. Please answer all questions before submitting.`
    );
  }

  const { categoryScores, overallScore, level } = calculateScores(
    assessment.answers,
    questions
  );

  // 🆕 Generate a unique, human-readable certificate ID
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
  assessment.categoryScores = categoryScores;
  assessment.overallScore = overallScore;
  assessment.level = level;
  assessment.certificateId = certificateId;

  //  Compute completion time + flag rushed submissions
  const answersArray = Array.from(assessment.answers.values());
  if (answersArray.length >= 2) {
    // Get earliest and latest answer timestamps
    const timestamps = answersArray
      .map((a) => a.answeredAt?.getTime())
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (timestamps.length >= 2) {
      const totalMs = timestamps[timestamps.length - 1] - timestamps[0];
      const avgSecPerQuestion = totalMs / 1000 / answersArray.length;

      assessment.completionTimeMs = totalMs;
      assessment.avgSecPerQuestion = Math.round(avgSecPerQuestion);
      assessment.rushed = avgSecPerQuestion < 3;   // <3 sec = rushed
    }
  }

  await assessment.save();

  req.user.hasCompletedAssessment = true;
  await req.user.save();

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

  if (!assessment) {
    throw new ApiError(404, "Assessment not found");
  }
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
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
  // Fetch raw docs first (we need answer count without sending the full map)
  const docs = await Assessment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean(); // plain JS objects = easier to transform

  // Transform: replace heavy `answers` map with just its size
  const assessments = docs.map((a) => {
    const answerCount = a.answers ? Object.keys(a.answers).length : 0;
    delete a.answers; // remove the big field
    return {
      ...a,
      answerCount,
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
  if (!assessment) {
    throw new ApiError(404, "Assessment not found");
  }
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(400, "This assessment has already been submitted");
  }

  // Remove the answer from the Map
  assessment.answers.delete(questionId);
  await assessment.save();

  const totalQuestions = await scoredQuestionCount();

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

  if (!assessment) {
    throw new ApiError(404, "Assessment not found");
  }
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
 *
 * Only allows deletion of in-progress assessments — submitted ones are permanent records.
 */
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, "Assessment not found");
  }
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status === "submitted") {
    throw new ApiError(
      400,
      "Submitted assessments cannot be deleted. They're a permanent record of your skills."
    );
  }

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
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const cooldownStart = new Date(Date.now() - cooldownMs);

  const hasInProgress = await Assessment.exists({
    user: req.user._id,
    status: "in-progress",
  });

  // If user has in-progress, they should focus on that, not cooldown
  if (hasInProgress) {
    return res.status(200).json({
      success: true,
      data: {
        cooldown: {
          active: false,
          cooldownDays: COOLDOWN_DAYS,
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
          cooldownDays: COOLDOWN_DAYS,
        },
      },
    });
  }

  const submittedAt = new Date(recentSubmission.submittedAt);
  const nextAvailable = new Date(submittedAt.getTime() + cooldownMs);
  const daysRemaining = Math.ceil(
    (nextAvailable - Date.now()) / (24 * 60 * 60 * 1000)
  );

  res.status(200).json({
    success: true,
    data: {
      cooldown: {
        active: true,
        cooldownDays: COOLDOWN_DAYS,
        lastSubmittedAt: submittedAt.toISOString(),
        nextAvailableAt: nextAvailable.toISOString(),
        daysRemaining,
      },
    },
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