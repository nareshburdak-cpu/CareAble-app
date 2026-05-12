// server/controllers/adminController.js

/**
 * Admin Controller
 * ----------------
 * Endpoints for the admin panel.
 * All routes are protected by `requireAdmin` middleware.
 */

const User = require("../models/User");
const Assessment = require("../models/Assessment");
const asyncHandler = require("../utils/asyncHandler");
const categoryCache = require("../utils/categoryCache");
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
    categoryMap,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Assessment.countDocuments({}),
    Assessment.countDocuments({ status: "submitted" }),

    Assessment.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: null, avg: { $avg: "$overallScore" } } },
    ]),

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

    Assessment.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]),

    Assessment.aggregate([
      { $match: { status: "submitted" } },
      {
        $project: {
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

    Assessment.find({ status: "submitted" })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .select("overallScore level submittedAt user")
      .lean(),

    categoryCache.getAllCategoriesIncludingArchived().then((cats) =>
      Object.fromEntries(cats.map((c) => [c.key, c]))
    ),
  ]);

  const fillMissingDays = (data, days = 30) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const found = data.find((item) => item._id === key);
      result.push({ date: key, count: found ? found.count : 0 });
    }
    return result;
  };

  const categoryStats = avgScoreByCategory.map((c) => {
    const meta = categoryMap[c._id];
    return {
      key: c._id,
      label: meta?.label || c._id,
      icon: meta?.icon || "",
      color: meta?.color || "indigo",
      // Keep 2dp precision — scores are now 1–5 floats, not 0–100 integers.
      avgScore: parseFloat(c.avg.toFixed(2)),
      count: c.count,
    };
  });

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
        // 2dp float — scores are now 1–5, not 0–100.
        avgScore: avgScoreResult[0]
          ? parseFloat(avgScoreResult[0].avg.toFixed(2))
          : 0,
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
 */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();
  const filter = req.query.filter || "all";

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
 * @desc    Update a user (role, isActive, emailVerified)
 * @route   PATCH /api/admin/users/:id
 * @access  Admin
 */

const updateUser = asyncHandler(async (req, res) => {
  const { role, addRole, removeRole, isActive, emailVerified } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const isSelf = user._id.toString() === req.user._id.toString();

  // ── Legacy role field (backward compat) ──────────────────────
  // Still supported so old promote/demote calls don't break.
  // Maps: "admin" → adds admin role, "user" → removes admin role.
  if (typeof role === "string") {
    if (isSelf) throw new ApiError(400, "You cannot change your own role");
    if (!["user", "admin", "employer"].includes(role)) {
      throw new ApiError(400, "Invalid role value");
    }

    if (role === "admin" && !user.roles.includes("admin")) {
      user.roles.push("admin");
    } else if (role === "user") {
      user.roles = user.roles.filter((r) => r !== "admin");
    } else if (role === "employer" && !user.roles.includes("employer")) {
      user.roles.push("employer");
    }

    user.syncLegacyRole();

    await logAdminAction(req, role === "admin" ? "user.promote" : "user.demote", {
      targetType: "user",
      targetId: user._id,
      details: { role, email: user.email },
    });
  }

  // ── Add a role (multi-role aware) ────────────────────────────
  if (typeof addRole === "string") {
    if (isSelf && addRole === "admin") {
      throw new ApiError(400, "You cannot grant yourself the admin role");
    }
    const VALID_ROLES = ["carer", "employer", "admin"];
    if (!VALID_ROLES.includes(addRole)) {
      throw new ApiError(400, `Invalid role: ${addRole}`);
    }
    if (!user.roles.includes(addRole)) {
      user.roles.push(addRole);
      user.syncLegacyRole();
      await logAdminAction(req, "user.role.add", {
        targetType: "user",
        targetId: user._id,
        details: { addRole, email: user.email },
      });
    }
  }

  // ── Remove a role ─────────────────────────────────────────────
  if (typeof removeRole === "string") {
    if (isSelf && removeRole === "admin") {
      throw new ApiError(400, "You cannot remove your own admin role");
    }
    // Always keep at least one role
    const afterRemoval = user.roles.filter((r) => r !== removeRole);
    if (afterRemoval.length === 0) {
      throw new ApiError(400, "Cannot remove all roles — user must have at least one role");
    }
    user.roles = afterRemoval;
    user.syncLegacyRole();
    await logAdminAction(req, "user.role.remove", {
      targetType: "user",
      targetId: user._id,
      details: { removeRole, email: user.email },
    });
  }

  // ── isActive ──────────────────────────────────────────────────
  if (typeof isActive === "boolean") {
    if (isSelf) throw new ApiError(400, "You cannot deactivate your own account");
    user.isActive = isActive;
    await logAdminAction(req, isActive ? "user.reactivate" : "user.deactivate", {
      targetType: "user",
      targetId: user._id,
      details: { email: user.email },
    });
  }

  // ── emailVerified ─────────────────────────────────────────────
  if (typeof emailVerified === "boolean") {
    user.emailVerified = emailVerified;
    await logAdminAction(req, emailVerified ? "user.verify" : "user.unverify", {
      targetType: "user",
      targetId: user._id,
      details: { email: user.email },
    });
  }

  await user.save();

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
  const { category, type, text, helper, options } = req.body;

  if (!category || !type || !text) {
    throw new ApiError(400, "Category, type, and text are required");
  }

  const categoryDoc = await categoryCache.getCategoryByKey(category);
  if (!categoryDoc) {
    throw new ApiError(
      400,
      `Category '${category}' does not exist or is archived. Use an active category from /api/admin/categories.`
    );
  }

  const VALID_TYPES = ["likert", "frequency", "multi"];
  if (!VALID_TYPES.includes(type)) {
    throw new ApiError(400, `Type must be one of: ${VALID_TYPES.join(", ")}`);
  }

  if (type === "multi" && (!Array.isArray(options) || options.length === 0)) {
    throw new ApiError(400, "Multi-select questions need at least one option");
  }

  const lastOrder = await Question.findOne({ category })
    .sort({ order: -1 })
    .select("order")
    .lean();
  const order = (lastOrder?.order || 0) + 1;

  const question = await Question.create({
    category,
    type,
    text: text.trim(),
    helper: helper?.trim() || undefined,
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
  const { text, helper, options, isArchived, order } = req.body;

  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  const originalText = question.text;
  const originalArchived = question.isArchived;

  if (typeof text === "string") question.text = text.trim();
  if (typeof helper === "string") question.helper = helper.trim() || undefined;

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


/**
 * @desc    List all assessments (admin only)
 * @route   GET /api/admin/assessments
 * @access  Admin
 */
const listAssessments = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 20);
  const skip   = (page - 1) * limit;
  const search = (req.query.search || "").trim();
  const filter = req.query.filter || "all"; // all | submitted | in-progress

  // ── Build query ──────────────────────────────────────────────────
  const query = {};

  if (filter === "submitted")   query.status = "submitted";
  if (filter === "in-progress") query.status = "in-progress";

  // If searching, find matching users first
  let userIdFilter = null;
  if (search) {
    const matchingUsers = await require("../models/User")
      .find({
        $or: [
          { name:  { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      })
      .select("_id")
      .lean();
    userIdFilter = matchingUsers.map((u) => u._id);
    query.user = { $in: userIdFilter };
  }

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate({ path: "user", select: "name email roles isActive" })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      assessments,
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
  listAssessments,
};