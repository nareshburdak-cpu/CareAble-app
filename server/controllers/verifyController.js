// server/controllers/verifyController.js

/**
 * Verify Controller
 * -----------------
 * Public endpoint to verify the authenticity of a CareAble certificate.
 *
 *   GET /api/verify/:certificateId         (NO AUTH — public)
 *   GET /api/verify/employer/:certificateId (protected — employer or admin)
 *   GET /api/verify/admin/:certificateId    (protected — admin only)
 */

const Assessment = require("../models/Assessment");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { getCategoryMap } = require("../utils/categoryCache");

const CERT_ID_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

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
    .populate({ path: "user", select: "name isActive" })
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

module.exports = {
  verifyCertificate,
  verifyCertificateEmployer,
  verifyCertificateAdmin,
};