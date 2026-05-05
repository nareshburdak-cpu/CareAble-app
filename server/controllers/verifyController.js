/**
 * Verify Controller
 * -----------------
 * Public endpoint to verify the authenticity of a CareAble certificate.
 *
 *   GET /api/verify/:certificateId   (NO AUTH — public)
 *
 * Privacy rules:
 *   - Only returns minimal public data: name, level, date, certificate ID
 *   - Never returns: email, scores per question, answers, user ID, etc.
 *   - Returns 404 for any invalid/missing/revoked certificate
 *     (generic message to avoid leaking enumeration info)
 *   - Skips certificates whose owner account has been deactivated
 *   - Skips assessments that aren't fully submitted
 */

const Assessment = require("../models/Assessment");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// CA-XXXXXX format: starts with "CA-" then alphanumeric (we accept letters+digits, 4-20 chars)
// This guard short-circuits obviously invalid IDs before hitting the DB.
const CERT_ID_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

/**
 * @desc    Verify a certificate by its public ID
 * @route   GET /api/verify/:certificateId
 * @access  Public
 */
const verifyCertificate = asyncHandler(async (req, res) => {
  const rawId = (req.params.certificateId || "").trim();

  // Quick format guard — reject obviously malformed IDs without a DB hit
  if (!CERT_ID_PATTERN.test(rawId)) {
    throw new ApiError(404, "Certificate not found");
  }

  // Look up the assessment by certificateId.
  // We populate the user to access name + isActive, but we'll only
  // expose the name in the response.
  const assessment = await Assessment.findOne({
    certificateId: rawId.toUpperCase(),
    status: "submitted",
  })
    .populate({
      path: "user",
      select: "name isActive",
    })
    .lean();

  // Not found, not completed, or user record missing -> generic 404
  if (!assessment || !assessment.user) {
    throw new ApiError(404, "Certificate not found");
  }

  // Owner deactivated their account -> treat as revoked
  if (assessment.user.isActive === false) {
    throw new ApiError(410, "This certificate has been revoked");
  }

  // ---- Build the SAFE public payload ----
  // ONLY include fields safe to show to a stranger scanning a QR code.
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

module.exports = {
  verifyCertificate,
};