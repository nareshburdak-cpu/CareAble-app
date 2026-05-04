/**
 * Admin Controller
 * ----------------
 * Endpoints for the admin panel.
 * All routes are protected by `requireAdmin` middleware.
 */

const User = require("../models/User");
const Assessment = require("../models/Assessment");
const asyncHandler = require("../utils/asyncHandler");
const CATEGORIES = require("../utils/categories");
const ApiError = require("../utils/ApiError");
const Question = require("../models/Question");
const { logAdminAction } = require("../utils/audit");
const AuditLog = require("../models/AuditLog");

/**
 * @desc    Get analytics dashboard data
 * @route   GET /api/admin/analytics
 * @access  Admin
 */
  const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Run all aggregations in parallel for speed
  const [
    totalUsers,
    verifiedUsers,
    signupsToday,
    signupsThisWeek,
    totalAssessments,
    submittedAssessments,
    avgScoreResult,
    signupsByDay,
    submissionsByDay,
    levelDistribution,
    avgScoreByCategory,
    recentSubmissions,
  ] = await Promise.all([
    // 1. Total users
    User.countDocuments({}),

    // 2. Verified users
    User.countDocuments({ emailVerified: true }),

    // 3. Signups today
    User.countDocuments({ createdAt: { $gte: today } }),

    // 4. Signups this week
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

    // 5. Total assessments (any status)
    Assessment.countDocuments({}),

    // 6. Submitted (completed)
    Assessment.countDocuments({ status: "submitted" }),

    // 7. Average score across all submitted
    Assessment.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: null, avg: { $avg: "$overallScore" } } },
    ]),

    // 8. Signups per day for last 30 days
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 9. Submissions per day for last 30 days
    Assessment.aggregate([
      {
        $match: {
          status: "submitted",
          submittedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 10. Level distribution
    Assessment.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]),

    // 11. Average score per category
    Assessment.aggregate([
      { $match: { status: "submitted" } },
      {
        $project: {
          // Convert categoryScores Map to array of {key, value}
          scores: { $objectToArray: "$categoryScores" },
        },
      },
      { $unwind: "$scores" },
      {
        $group: {
          _id: "$scores.k",
          avg: { $avg: "$scores.v" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avg: -1 } },
    ]),

    // 12. Recent submissions (last 10)
    Assessment.find({ status: "submitted" })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .select("overallScore level submittedAt user")
      .lean(),
  ]);

  // Helper: fill in missing days with 0 for chart continuity
  const fillMissingDays = (data, days = 30) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const found = data.find((item) => item._id === key);
      result.push({
        date: key,
        count: found ? found.count : 0,
      });
    }
    return result;
  };

  // Enrich category data with friendly names
  const categoryStats = avgScoreByCategory.map((c) => ({
    key: c._id,
    title: CATEGORIES[c._id]?.title || c._id,
    avgScore: Math.round(c.avg),
    count: c.count,
  }));

  // Build the final response
  res.status(200).json({
    success: true,
    data: {
      headline: {
        totalUsers,
        verifiedUsers,
        verifiedRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        signupsToday,
        signupsThisWeek,
        totalAssessments,
        submittedAssessments,
        completionRate: totalAssessments > 0
          ? Math.round((submittedAssessments / totalAssessments) * 100)
          : 0,
        avgScore: avgScoreResult[0] ? Math.round(avgScoreResult[0].avg) : 0,
      },
      signupsByDay: fillMissingDays(signupsByDay),
      submissionsByDay: fillMissingDays(submissionsByDay),
      levelDistribution: levelDistribution.map((l) => ({
        level: l._id || "Unknown",
        count: l.count,
      })),
      categoryStats,
      recentSubmissions,
    },
  });
});


/**
 * @desc    List users (paginated, searchable, filterable)
 * @route   GET /api/admin/users
 * @access  Admin
 *
 * Query params:
 *   - page (default 1)
 *   - limit (default 20, max 100)
 *   - search (matches name OR email)
 *   - filter: "all" | "verified" | "unverified" | "admins" | "deactivated"
 */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();
  const filter = req.query.filter || "all";

  // Build the query
  const query = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    query.$or = [{ name: regex }, { email: regex }];
  }

  if (filter === "verified") query.emailVerified = true;
  else if (filter === "unverified") query.emailVerified = false;
  else if (filter === "admins") query.role = "admin";
  else if (filter === "deactivated") query.isActive = false;

  // For all/verified/unverified/admins → only show active users
  if (filter !== "deactivated") {
    query.isActive = { $ne: false };
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -passwordResetToken -emailVerifyToken -otpHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get a single user with their assessments
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -passwordResetToken -emailVerifyToken -otpHash")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const assessments = await Assessment.find({ user: user._id })
    .select("status overallScore level submittedAt updatedAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { user, assessments },
  });
});

/**
 * @desc    Update user (admin actions)
 * @route   PATCH /api/admin/users/:id
 * @access  Admin
 *
 * Body (any subset):
 *   - emailVerified: boolean    (force-verify)
 *   - role: "user" | "admin"    (promote/demote)
 *   - isActive: boolean         (activate/deactivate)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { emailVerified, role, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Self-protection: admins can't demote / deactivate themselves
  if (user._id.toString() === req.user._id.toString()) {
    if (role === "user") {
      throw new ApiError(400, "You cannot demote yourself.");
    }
    if (isActive === false) {
      throw new ApiError(400, "You cannot deactivate your own account.");
    }
  }

  if (typeof emailVerified === "boolean") {
    user.emailVerified = emailVerified;
    if (emailVerified) {
      user.emailVerifyToken = undefined;
      user.emailVerifyExpires = undefined;
    }
  }

  if (role && ["user", "admin"].includes(role)) {
    user.role = role;
  }

  if (typeof isActive === "boolean") {
    user.isActive = isActive;
  }

  await user.save({ validateBeforeSave: false });
  // 📝 Audit log
  const changes = {};
  if (typeof emailVerified === "boolean") {
    changes.emailVerified = emailVerified;
    await logAdminAction(req, emailVerified ? "user.verify" : "user.unverify", {
      targetType: "user",
      targetId: user._id,
      details: { email: user.email },
    });
  }
  if (role && ["user", "admin"].includes(role)) {
    await logAdminAction(req, role === "admin" ? "user.promote" : "user.demote", {
      targetType: "user",
      targetId: user._id,
      details: { email: user.email, newRole: role },
    });
  }
  if (typeof isActive === "boolean") {
    await logAdminAction(req, isActive ? "user.reactivate" : "user.deactivate", {
      targetType: "user",
      targetId: user._id,
      details: { email: user.email },
    });
  }

  // Return clean user (without sensitive fields)
  const cleaned = user.toObject();
  delete cleaned.password;
  delete cleaned.passwordResetToken;
  delete cleaned.emailVerifyToken;
  delete cleaned.otpHash;

  res.status(200).json({
    success: true,
    message: "User updated.",
    data: { user: cleaned },
  });
});


/**
 * @desc    List all questions (including archived) for admin
 * @route   GET /api/admin/questions
 * @access  Admin
 */
const listQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find()
    .sort({ category: 1, order: 1 })
    .lean();

  // Group by category for easy display
  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  }

  res.status(200).json({
    success: true,
    data: {
      questions,
      byCategory,
      total: questions.length,
      activeCount: questions.filter((q) => !q.isArchived).length,
      archivedCount: questions.filter((q) => q.isArchived).length,
    },
  });
});

/**
 * @desc    Create a new question
 * @route   POST /api/admin/questions
 * @access  Admin
 */
const createQuestion = asyncHandler(async (req, res) => {
  const { category, type, text, helpText, options } = req.body;

  if (!category || !type || !text) {
    throw new ApiError(400, "Category, type, and text are required");
  }

  const VALID_TYPES = ["likert", "frequency", "multi"];
  if (!VALID_TYPES.includes(type)) {
    throw new ApiError(400, `Type must be one of: ${VALID_TYPES.join(", ")}`);
  }

  // Multi-select questions need options
  if (type === "multi" && (!Array.isArray(options) || options.length === 0)) {
    throw new ApiError(400, "Multi-select questions need at least one option");
  }

  // Auto-assign order: append to end of category
  const lastOrder = await Question.findOne({ category })
    .sort({ order: -1 })
    .select("order")
    .lean();
  const order = (lastOrder?.order || 0) + 1;

  const question = await Question.create({
    category,
    type,
    text: text.trim(),
    helpText: helpText?.trim() || undefined,
    options: type === "multi" ? options : undefined,
    order,
    lastEditedBy: req.user._id,
    lastEditedAt: new Date(),
  });

  await logAdminAction(req, "question.create", {
    targetType: "question",
    targetId: question._id,
    details: {
      category: question.category,
      type: question.type,
      text: question.text.slice(0, 100),
    },
  });

  res.status(201).json({
    success: true,
    message: "Question created.",
    data: { question },
  });
});

/**
 * @desc    Update a question
 * @route   PATCH /api/admin/questions/:id
 * @access  Admin
 */
const updateQuestion = asyncHandler(async (req, res) => {
  const { text, helpText, options, isArchived, order } = req.body;

  const question = await Question.findById(req.params.id);
  const originalText = question.text;
  const originalArchived = question.isArchived;
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  if (typeof text === "string") question.text = text.trim();
  if (typeof helpText === "string") question.helpText = helpText.trim() || undefined;

  if (Array.isArray(options) && question.type === "multi") {
    question.options = options;
  }

  if (typeof isArchived === "boolean") {
    question.isArchived = isArchived;
  }

  if (typeof order === "number") {
    question.order = order;
  }

  question.lastEditedBy = req.user._id;
  question.lastEditedAt = new Date();

  await question.save();


  // 📝 Audit log
  if (typeof isArchived === "boolean" && isArchived !== originalArchived) {
    await logAdminAction(req, isArchived ? "question.archive" : "question.restore", {
      targetType: "question",
      targetId: question._id,
      details: { text: question.text.slice(0, 100) },
    });
  } else {
    await logAdminAction(req, "question.update", {
      targetType: "question",
      targetId: question._id,
      details: {
        text: question.text.slice(0, 100),
        changedText: typeof text === "string" && text.trim() !== originalText,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Question updated.",
    data: { question },
  });
});

/**
 * @desc    Reorder a question (move up/down within its category)
 * @route   POST /api/admin/questions/:id/reorder
 * @access  Admin
 *
 * Body: { direction: "up" | "down" }
 */
const reorderQuestion = asyncHandler(async (req, res) => {
  const { direction } = req.body;
  if (!["up", "down"].includes(direction)) {
    throw new ApiError(400, "Direction must be 'up' or 'down'");
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  // Find the neighbor to swap with
  const neighbor = await Question.findOne({
    category: question.category,
    order: direction === "up" ? { $lt: question.order } : { $gt: question.order },
    isArchived: { $ne: true },
  }).sort({ order: direction === "up" ? -1 : 1 });

  if (!neighbor) {
    return res.status(200).json({
      success: true,
      message: `Already at the ${direction === "up" ? "top" : "bottom"}`,
    });
  }

  // Swap orders
  const tempOrder = question.order;
  question.order = neighbor.order;
  neighbor.order = tempOrder;

  await Promise.all([question.save(), neighbor.save()]);
  
  await logAdminAction(req, "question.reorder", {
    targetType: "question",
    targetId: question._id,
    details: { direction, category: question.category },
  });

  res.status(200).json({
    success: true,
    message: "Question reordered.",
  });
});


/**
 * @desc    Get paginated audit logs
 * @route   GET /api/admin/audit
 * @access  Admin
 *
 * Query params:
 *   - page (default 1)
 *   - limit (default 50, max 200)
 *   - action (optional filter)
 *   - actorId (optional filter)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;
  const { action, actorId } = req.query;

  const query = {};
  if (action) query.action = action;
  if (actorId) query.actor = actorId;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name email")
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});


module.exports = {
  getAnalytics,
  listUsers,
  getUser,
  updateUser,
  listQuestions,    
  createQuestion,   
  updateQuestion,   
  reorderQuestion, 
  getAuditLogs, 
};
