/**
 * Auth Controller
 * ---------------
 * Handles user authentication endpoints:
 *   - register, login, getMe, updateProfile
 *   - changePassword, deleteAccount (OTP-protected)
 *   - forgotPassword, resetPassword
 *   - verifyEmail, resendVerification
 *   - requestOtp, verifyOtp
 */

const User = require("../models/User");
const Assessment = require("../models/Assessment");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { sendEmail } = require("../utils/sendEmail");
const { checkEmailRateLimit, logEmailSent } = require("../utils/emailRateLimit");
const {
  welcomeEmail,
  passwordResetEmail,
  verifyEmailTemplate,
  otpEmail,
} = require("../utils/emailTemplates");

// =============================================================================
// OTP CHALLENGE HELPERS
// =============================================================================

// Sign a short-lived "OTP challenge" token after successful OTP verification
function signOtpChallenge(userId, action) {
  return jwt.sign(
    { userId: userId.toString(), action, type: "otp-challenge" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
}

// Verify a challenge token — used by sensitive endpoints
function verifyOtpChallenge(token, expectedUserId, expectedAction) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "otp-challenge") return null;
    if (payload.userId !== expectedUserId.toString()) return null;
    if (payload.action !== expectedAction) return null;
    return payload;
  } catch {
    return null;
  }
}

// =============================================================================
// REGISTRATION & AUTH
// =============================================================================

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, roles } = req.body;

  const ALLOWED_SIGNUP_ROLES = ["carer", "employer"];
  const requestedRoles = Array.isArray(roles)
    ? roles.filter((r) => ALLOWED_SIGNUP_ROLES.includes(r))
    : [];
  const assignedRoles = requestedRoles.length > 0 ? requestedRoles : ["carer"];

  const user = await User.create({
    name,
    email,
    password,
    roles: assignedRoles,
    role: assignedRoles.includes("employer") && !assignedRoles.includes("carer")
      ? "employer"
      : "user",
  });
  // Generate email verification token
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  // Build verification URL
  const clientUrl = process.env.CLIENT_URL || "https://careable.site";
  const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;

  // Send welcome email
  try {
    const welcomeContent = welcomeEmail({ name: user.name });
    await sendEmail({
      to: user.email,
      subject: welcomeContent.subject,
      html: welcomeContent.html,
    });
    await logEmailSent(user._id, "welcome");
  } catch (err) {
    console.error("Welcome email failed:", err.message);
  }

  // Send verification email
  try {
    const verifyContent = verifyEmailTemplate({ name: user.name, verifyUrl });
    await sendEmail({
      to: user.email,
      subject: verifyContent.subject,
      html: verifyContent.html,
    });
    await logEmailSent(user._id, "verify-email");
  } catch (err) {
    console.error("Verify email failed:", err.message);
  }

  res.status(201).json({
    success: true,
    data: { user, token },
  });
});

/**
 * @desc    Login user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Block deactivated accounts
  if (user.isActive === false) {
    throw new ApiError(403, "This account has been deactivated. Please contact support.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Logged in successfully 👋",
    data: { user, token },
  });
});

/**
 * @desc    Get current logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

/**
 * @desc    Update current user's profile (name only for now)
 * @route   PATCH /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Name is required");
  }
  if (name.trim().length < 2 || name.trim().length > 50) {
    throw new ApiError(400, "Name must be 2–50 characters");
  }

  req.user.name = name.trim();
  await req.user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated 🎉",
    data: { user: req.user },
  });
});

// =============================================================================
// SENSITIVE ACTIONS (OTP-PROTECTED)
// =============================================================================

/**
 * @desc    Change current user's password (OTP-protected)
 * @route   PATCH /api/auth/password
 * @access  Private
 *
 * Body: { currentPassword, newPassword, otpToken }
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, otpToken } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new passwords are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  // 🛡️ Require OTP challenge
  if (!otpToken) {
    throw new ApiError(403, "Security code required. Please verify your identity first.");
  }
  const challenge = verifyOtpChallenge(otpToken, req.user._id, "change-password");
  if (!challenge) {
    throw new ApiError(403, "Security check failed. Please verify again.");
  }

  // Verify current password
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Save new password (pre-save hook re-hashes)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * @desc    Delete account (OTP-protected; cascades to assessments)
 * @route   DELETE /api/auth/me
 * @access  Private
 *
 * Body: { password, otpToken }
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password, otpToken } = req.body;

  if (!password) {
    throw new ApiError(400, "Password confirmation required");
  }

  // 🛡️ Require OTP challenge
  if (!otpToken) {
    throw new ApiError(403, "Security code required. Please verify your identity first.");
  }
  const challenge = verifyOtpChallenge(otpToken, req.user._id, "delete-account");
  if (!challenge) {
    throw new ApiError(403, "Security check failed. Please verify again.");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(400, "Incorrect password");
  }

  // Cascade delete user's assessments first, then the user
  await Assessment.deleteMany({ user: req.user._id });
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "Account deleted. We're sorry to see you go.",
  });
});

// =============================================================================
// PASSWORD RESET (FORGOT PASSWORD)
// =============================================================================

/**
 * @desc    Request a password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 *
 * Always returns success — prevents email enumeration.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  const successResponse = {
    success: true,
    message: "If an account with that email exists, we've sent a password reset link.",
  };

  if (!user) {
    return res.status(200).json(successResponse);
  }
  // Rate-limit check
  await checkEmailRateLimit(user._id, "password-reset");

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "https://careable.site";
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  try {
    const emailContent = passwordResetEmail({ name: user.name, resetUrl });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    await logEmailSent(user._id, "password-reset");
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Password reset email failed:", err.message);
    throw new ApiError(500, "Could not send reset email. Please try again later.");
  }

  return res.status(200).json(successResponse);
});

/**
 * @desc    Reset password using token from email
 * @route   POST /api/auth/reset-password
 * @access  Public
 *
 * Body: { token, newPassword }
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Auto-login: issue fresh JWT
  const newToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You're now logged in.",
    data: { user, token: newToken },
  });
});

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================

/**
 * @desc    Verify email using token from email link
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: { $gt: Date.now() },
  }).select("+emailVerifyToken +emailVerifyExpires");

  if (!user) {
    throw new ApiError(400, "Verification link is invalid or has expired. Request a new one.");
  }

  // Idempotent — clicking link twice is fine
  if (user.emailVerified) {
    return res.status(200).json({
      success: true,
      message: "Email is already verified.",
      data: { alreadyVerified: true },
    });
  }

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Email verified successfully! 🎉",
    data: { alreadyVerified: false },
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerification = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.emailVerified) {
    throw new ApiError(400, "Your email is already verified.");
  }
  await checkEmailRateLimit(user._id, "verify-email");
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "https://careable.site";
  const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;

  try {
    const emailContent = verifyEmailTemplate({ name: user.name, verifyUrl });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    await logEmailSent(user._id, "verify-email");
  } catch (err) {
    console.error("Resend verification failed:", err.message);
    throw new ApiError(500, "Could not send verification email. Try again later.");
  }

  res.status(200).json({
    success: true,
    message: "Verification email sent! Check your inbox.",
  });
});

// =============================================================================
// OTP REQUEST / VERIFY
// =============================================================================

/**
 * @desc    Request an OTP for a sensitive action
 * @route   POST /api/auth/request-otp
 * @access  Private
 *
 * Body: { action: "change-password" | "delete-account" }
 */
const requestOtp = asyncHandler(async (req, res) => {
  const { action } = req.body;

  const VALID_ACTIONS = ["change-password", "delete-account"];
  if (!action || !VALID_ACTIONS.includes(action)) {
    throw new ApiError(400, "Invalid action");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  await checkEmailRateLimit(user._id, "otp");
  const otp = user.createOtp(action);
  await user.save({ validateBeforeSave: false });

  try {
    const emailContent = otpEmail({ name: user.name, otp, action });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    await logEmailSent(user._id, "otp");
  } catch (err) {
    console.error("OTP email failed:", err.message);
    throw new ApiError(500, "Could not send security code. Please try again.");
  }

  res.status(200).json({
    success: true,
    message: "Security code sent. Check your email.",
  });
});

/**
 * @desc    Verify OTP, return short-lived challenge token
 * @route   POST /api/auth/verify-otp
 * @access  Private
 *
 * Body: { action, otp }
 * Returns: { otpToken } (5-min JWT scoped to action)
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { action, otp } = req.body;

  if (!action || !otp) {
    throw new ApiError(400, "Action and code are required");
  }

  const user = await User.findById(req.user._id).select(
    "+otpHash +otpAction +otpExpires +otpAttempts"
  );
  if (!user) throw new ApiError(404, "User not found");

  if (!user.otpHash || !user.otpExpires) {
    throw new ApiError(400, "No active code. Request a new one.");
  }

  if (user.otpAction !== action) {
    throw new ApiError(400, "Code is for a different action.");
  }

  if (user.otpExpires < Date.now()) {
    user.otpHash = undefined;
    user.otpAction = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "Code has expired. Request a new one.");
  }

  if (user.otpAttempts >= 5) {
    user.otpHash = undefined;
    user.otpAction = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(429, "Too many attempts. Request a new code.");
  }

  const otpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
  if (otpHash !== user.otpHash) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "Incorrect code.");
  }

  // ✅ Success — clear OTP, issue challenge token
  user.otpHash = undefined;
  user.otpAction = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  const otpToken = signOtpChallenge(user._id, action);

  res.status(200).json({
    success: true,
    message: "Code verified.",
    data: { otpToken },
  });
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  requestOtp,
  verifyOtp,
};