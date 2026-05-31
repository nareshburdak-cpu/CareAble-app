/** @file Certificate verification and employer interest endpoints. */
const Assessment = require("../models/Assessment");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { getCategoryMap } = require("../utils/categoryCache");
const { sendEmail } = require("../utils/sendEmail");
const { employerInterestEmail } = require("../utils/emailTemplates");
const EmailLog = require("../models/EmailLog");

const CERT_ID_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

/**
 * Mask an email for privacy: keep first 2 chars of the local part + domain.
 *   "naresh@gmail.com" → "na****@gmail.com"
 *   "ab@x.com"          → "a*@x.com"
 */
function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0] || ""}*@${domain}`;
  }
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

// ── existing public handler (DO NOT CHANGE) ────────────────────────────────
const verifyCertificate = asyncHandler(async (req, res) => {
  const rawId = (req.params.certificateId || "").trim();

  if (!CERT_ID_PATTERN.test(rawId)) {
    throw new ApiError(404, "Certificate not found");
  }

  const assessment = await Assessment.findOne({
    certificateId: rawId.toUpperCase(),
    status: "submitted",
  })
    .populate({ path: "user", select: "name isActive" })
    .lean();

  if (!assessment || !assessment.user) {
    throw new ApiError(404, "Certificate not found");
  }

  if (assessment.user.isActive === false) {
    throw new ApiError(410, "This certificate has been revoked");
  }

  return res.status(200).json({
    success: true,
    data: {
      certificateId: assessment.certificateId,
      name: assessment.user.name,
      level: assessment.level,
      issuedAt: assessment.submittedAt,
      issuer: "CareAble",
      verified: true,
    },
  });
});

// ── employer-level verify ──────────────────────────────────────────────────
/**
 * @desc  Verify a certificate with enriched data for employers
 * @route GET /api/verify/employer/:certificateId
 * @access Protected — employer or admin
 */
const verifyCertificateEmployer = asyncHandler(async (req, res) => {
  const rawId = (req.params.certificateId || "").trim();

  if (!CERT_ID_PATTERN.test(rawId)) {
    throw new ApiError(404, "Certificate not found");
  }

  const assessment = await Assessment.findOne({
    certificateId: rawId.toUpperCase(),
    status: "submitted",
  })
    .populate({ path: "user", select: "name email isActive" })
    .lean();

  if (!assessment || !assessment.user) {
    throw new ApiError(404, "Certificate not found");
  }

  if (assessment.user.isActive === false) {
    throw new ApiError(410, "This certificate has been revoked");
  }

  // Resolve category keys → human-readable labels
  const categoryMap = await getCategoryMap(); // { key: { name, ... } }

  // categoryScores is a Map — convert to plain object with labels
  const domainScores = {};
  if (assessment.categoryScores) {
    for (const [key, score] of Object.entries(assessment.categoryScores)) {
      const label = categoryMap[key]?.name || key;
      domainScores[label] = score;
    }
  }

  // Top areas = domains >= 4.0
  const topAreas = Object.entries(domainScores)
    .filter(([, score]) => score >= 4.0)
    .map(([label]) => label);

  return res.status(200).json({
    success: true,
    data: {
      certificateId: assessment.certificateId,
      name: assessment.user.name,
      maskedEmail: maskEmail(assessment.user.email),
      level: assessment.level,
      overallScore: assessment.overallScore,
      domainScores,
      topAreas,
      issuedAt: assessment.submittedAt,
      completionTimeMs: assessment.completionTimeMs ?? null,
      issuer: "CareAble",
      verified: true,
    },
  });
});

// ── admin-level verify ─────────────────────────────────────────────────────
/**
 * @desc  Verify a certificate with full data for admins
 * @route GET /api/verify/admin/:certificateId
 * @access Protected — admin only
 */
const verifyCertificateAdmin = asyncHandler(async (req, res) => {
  const rawId = (req.params.certificateId || "").trim();

  if (!CERT_ID_PATTERN.test(rawId)) {
    throw new ApiError(404, "Certificate not found");
  }

  const assessment = await Assessment.findOne({
    certificateId: rawId.toUpperCase(),
    status: "submitted",
  })
    .populate({ path: "user", select: "name email isActive roles createdAt" })
    .lean();

  if (!assessment || !assessment.user) {
    throw new ApiError(404, "Certificate not found");
  }

  // Admins see revoked certs — they need to investigate
  const isRevoked = assessment.user.isActive === false;

  const categoryMap = await getCategoryMap();

  const domainScores = {};
  if (assessment.categoryScores) {
    for (const [key, score] of Object.entries(assessment.categoryScores)) {
      const label = categoryMap[key]?.name || key;
      domainScores[label] = score;
    }
  }

  const topAreas = Object.entries(domainScores)
    .filter(([, score]) => score >= 4.0)
    .map(([label]) => label);

  return res.status(200).json({
    success: true,
    data: {
      // Certificate
      certificateId: assessment.certificateId,
      assessmentId: assessment._id,
      level: assessment.level,
      overallScore: assessment.overallScore,
      domainScores,
      topAreas,
      issuedAt: assessment.submittedAt,
      completionTimeMs: assessment.completionTimeMs ?? null,
      avgSecPerQuestion: assessment.avgSecPerQuestion ?? null,
      rushed: assessment.rushed ?? false,
      issuer: "CareAble",
      verified: true,
      isRevoked,
      // User
      userId: assessment.user._id,
      name: assessment.user.name,
      email: assessment.user.email,
      roles: assessment.user.roles,
      accountCreatedAt: assessment.user.createdAt,
    },
  });
});

// ── employer → carer connect (brokered) ────────────────────────────────────
/**
 * @desc  Employer requests to connect with a carer by certificate ID.
 *        CareAble emails the carer; the carer's address is never exposed to
 *        the employer. Employer's email is reply-to so the carer can respond.
 * @route POST /api/verify/employer/:certificateId/connect
 * @access Protected — employer or admin
 *
 * Body: { message?: string }
 */
const requestCarerConnect = asyncHandler(async (req, res) => {
  const rawId = (req.params.certificateId || "").trim();
  const employer = req.user;

  if (!CERT_ID_PATTERN.test(rawId)) {
    throw new ApiError(404, "Certificate not found");
  }

  let message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (message.length > 500) {
    throw new ApiError(400, "Message must be 500 characters or fewer.");
  }

  const assessment = await Assessment.findOne({
    certificateId: rawId.toUpperCase(),
    status: "submitted",
  })
    .populate({ path: "user", select: "name email isActive" })
    .lean();

  if (!assessment || !assessment.user) {
    throw new ApiError(404, "Certificate not found");
  }
  if (assessment.user.isActive === false) {
    throw new ApiError(410, "This certificate has been revoked");
  }

  const carer = assessment.user;

  if (carer._id.toString() === employer._id.toString()) {
    throw new ApiError(400, "You can't send a connection request to yourself.");
  }

  const dayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Rate limit 1: this employer → this carer, once per 24h
  const recentToCarer = await EmailLog.findOne({
    user: carer._id,
    actor: employer._id,
    type: "employer-connect",
    sentAt: { $gte: dayCutoff },
  });
  if (recentToCarer) {
    throw new ApiError(
      429,
      "You've already sent this carer a connection request in the last 24 hours."
    );
  }

  // Rate limit 2: this employer's total connect volume, max 20 per 24h
  const employerSentToday = await EmailLog.countDocuments({
    actor: employer._id,
    type: "employer-connect",
    sentAt: { $gte: dayCutoff },
  });
  if (employerSentToday >= 20) {
    throw new ApiError(
      429,
      "You've reached the daily limit for connection requests. Please try again tomorrow."
    );
  }

  // Send brokered email — carer's address stays server-side
  const emailContent = employerInterestEmail({
    carerName: carer.name,
    employerName: employer.name,
    employerOrg: "",
    message,
  });

  const sendResult = await sendEmail({
    to: carer.email,
    replyTo: employer.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  // sendEmail RETURNS {success:false} on error — it does not throw
  if (!sendResult.success) {
    throw new ApiError(500, "Could not send your request right now. Please try again later.");
  }

  // Log for rate limiting (recipient = carer, actor = employer)
  try {
    await EmailLog.create({ user: carer._id, actor: employer._id, type: "employer-connect" });
  } catch (err) {
    console.error("EmailLog create failed (employer-connect):", err.message);
    // Non-fatal — email already sent
  }

  return res.status(200).json({
    success: true,
    message: "Your interest has been sent. The carer will be in touch if they'd like to connect.",
  });
});

module.exports = {
  verifyCertificate,
  verifyCertificateEmployer,
  verifyCertificateAdmin,
  requestCarerConnect,
};