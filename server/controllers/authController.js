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
const { OAuth2Client } = require("google-auth-library");

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

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function issueAuthResponse(res, user, status = 200, message = "Logged in successfully.") {
  const token = generateToken(user._id);

  res.status(status).json({
    success: true,
    message,
    data: { user, token },
  });
}

async function verifyGoogleCredential(credential) {
  if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, "Google sign-in is not configured yet.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new ApiError(400, "Google account email is missing.");
  }
  if (!payload.email_verified) {
    throw new ApiError(400, "Please use a Google account with a verified email.");
  }

  return payload;
}

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

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Phase 12-B: Collects all Appendix 1 fields at signup.
 * Employer-only users are marked onboardingComplete: true immediately.
 * Carer users go through additional Appendix 2 onboarding next.
 */
const register = asyncHandler(async (req, res) => {
  const {
    // Account
    email,
    password,
    roles,

    // Appendix 1 — required for all roles
    firstName,
    lastName,
    useSingleName,
    phone,
    dob,
    postcode,
    acceptedTerms,
    consentToResearch,
  } = req.body;

  // ── Validate roles ───────────────────────────────────────────────
  const ALLOWED_SIGNUP_ROLES = ["carer", "employer"];
  const requestedRoles = Array.isArray(roles)
    ? roles.filter((r) => ALLOWED_SIGNUP_ROLES.includes(r))
    : [];
  const assignedRoles = requestedRoles.length > 0 ? requestedRoles : ["carer"];

  // ── Validate Appendix 1 fields ───────────────────────────────────
  // Name
  if (useSingleName) {
    if (!firstName?.trim()) {
      throw new ApiError(400, "Please enter your preferred name.");
    }
  } else {
    if (!firstName?.trim()) throw new ApiError(400, "First name is required.");
    if (!lastName?.trim())  throw new ApiError(400, "Last name is required.");
  }

  // Email
  if (!email?.trim()) throw new ApiError(400, "Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  // Password
  if (!password) throw new ApiError(400, "Password is required.");
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  // Phone — Australian format
  if (!phone?.trim()) throw new ApiError(400, "Phone number is required.");
  const phoneClean = phone.replace(/\s/g, "");
  if (!/^(\+?61|0)[2-9]\d{8}$/.test(phoneClean)) {
    throw new ApiError(
      400,
      "Please enter a valid Australian phone number (e.g. 0412 345 678)."
    );
  }

  // DOB
  if (!dob) throw new ApiError(400, "Date of birth is required.");
  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) {
    throw new ApiError(400, "Invalid date of birth.");
  }
  const minAge = new Date();
  minAge.setFullYear(minAge.getFullYear() - 16);
  if (dobDate > minAge) {
    throw new ApiError(400, "You must be at least 16 years old to use CareAble.");
  }

  // Postcode — Australian 4-digit
  if (!postcode?.trim()) throw new ApiError(400, "Postcode is required.");
  if (!/^\d{4}$/.test(postcode.trim())) {
    throw new ApiError(400, "Please enter a valid 4-digit Australian postcode.");
  }

  // Terms — required
  if (!acceptedTerms) {
    throw new ApiError(400, "You must accept the Terms of Service to continue.");
  }

  // ── Build display name ───────────────────────────────────────────
  const displayName = useSingleName
    ? firstName.trim()
    : `${firstName.trim()} ${lastName.trim()}`;
    console.log("displayName:", displayName);

  // ── Determine onboarding completion ──────────────────────────────
  // Employer-only → fully onboarded after signup (no Appendix 2 questions)
  // Carer or dual-role → still needs Appendix 2 questions
  const isEmployerOnly =
    assignedRoles.includes("employer") &&
    !assignedRoles.includes("carer");

  // ── Create user ──────────────────────────────────────────────────
// Add this right before User.create(...)
if (!displayName || displayName.trim().length < 2) {
  throw new ApiError(400, "Please enter a valid name.");
}
  const user = await User.create({
    name: displayName,
    firstName: firstName.trim(),
    lastName: useSingleName ? "" : lastName.trim(),
    useSingleName: !!useSingleName,
    email: email.trim().toLowerCase(),
    password,
    phone: phoneClean,
    dob: dobDate,
    postcode: postcode.trim(),
    acceptedTerms: true,
    consentToResearch: !!consentToResearch,
    onboardingComplete: isEmployerOnly, // employer = done; carer = needs Appendix 2
    roles: assignedRoles,
    role: isEmployerOnly ? "employer" : "user",
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

  if (!user.password) {
    throw new ApiError(400, "This account uses Google sign-in. Please continue with Google.");
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

async function getGoogleProfile(credential) {
  if (!credential) {
    throw new ApiError(400, "Google credential is required.");
  }

  const payload = await verifyGoogleCredential(credential);
  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const firstName = (payload.given_name || "").trim();
  const lastName = (payload.family_name || "").trim();
  const displayName =
    (payload.name || `${firstName} ${lastName}`.trim() || email.split("@")[0]).trim();

  return { payload, email, googleId, firstName, lastName, displayName };
}

async function attachGoogleToUser(user, googleProfile) {
  const { payload, googleId, firstName, lastName, displayName } = googleProfile;

  user.googleId = user.googleId || googleId;
  user.googleAvatar = payload.picture || user.googleAvatar;
  user.emailVerified = true;

  if (!user.name) user.name = displayName;
  if (!user.firstName && firstName) user.firstName = firstName;
  if (!user.lastName && lastName) user.lastName = lastName;
  if (!user.authProviders?.includes("google")) {
    user.authProviders = [...new Set([...(user.authProviders || []), "google"])];
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
}

/**
 * @desc    Login existing user with Google Identity token
 * @route   POST /api/auth/google/login
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
  const googleProfile = await getGoogleProfile(req.body.credential);
  const user = await User.findOne({ email: googleProfile.email });

  if (!user) {
    throw new ApiError(
      404,
      "No CareAble account exists for this Google email. Please sign up first.",
      { code: "ACCOUNT_NOT_FOUND" }
    );
  }

  if (user.isActive === false) {
    throw new ApiError(403, "This account has been deactivated. Please contact support.");
  }

  await attachGoogleToUser(user, googleProfile);
  issueAuthResponse(res, user, 200, "Logged in successfully.");
});

/**
 * @desc    Register or login with Google Identity token
 * @route   POST /api/auth/google/register
 * @access  Public
 */
const googleRegister = asyncHandler(async (req, res) => {
  const { roles, acceptedTerms, consentToResearch } = req.body;
  const googleProfile = await getGoogleProfile(req.body.credential);
  const { payload, email, googleId, firstName, lastName, displayName } = googleProfile;

  let user = await User.findOne({ email });

  if (user) {
    if (user.isActive === false) {
      throw new ApiError(403, "This account has been deactivated. Please contact support.");
    }

    await attachGoogleToUser(user, googleProfile);
    return issueAuthResponse(res, user, 200, "Logged in successfully.");
  }

  if (!acceptedTerms) {
    throw new ApiError(
      400,
      "Please accept the Terms of Service to continue with Google.",
      { code: "TERMS_REQUIRED" }
    );
  }

  const ALLOWED_SIGNUP_ROLES = ["carer", "employer"];
  const requestedRoles = Array.isArray(roles)
    ? roles.filter((role) => ALLOWED_SIGNUP_ROLES.includes(role))
    : [];
  const assignedRoles = requestedRoles.length > 0 ? requestedRoles : ["carer"];
  const isEmployerOnly =
    assignedRoles.includes("employer") &&
    !assignedRoles.includes("carer");

  user = await User.create({
    name: displayName,
    firstName: firstName || displayName,
    lastName,
    useSingleName: !lastName,
    email,
    emailVerified: true,
    googleId,
    googleAvatar: payload.picture || "",
    authProviders: ["google"],
    acceptedTerms: true,
    consentToResearch: !!consentToResearch,
    onboardingComplete: isEmployerOnly,
    roles: assignedRoles,
    role: isEmployerOnly ? "employer" : "user",
    lastLoginAt: new Date(),
  });

    // Send welcome email (new Google users only — this branch is creation-only).
  // No verification email: Google already verified the address.
  try {
    const welcomeContent = welcomeEmail({ name: user.name });
    await sendEmail({
      to: user.email,
      subject: welcomeContent.subject,
      html: welcomeContent.html,
    });
    await logEmailSent(user._id, "welcome");
  } catch (err) {
    console.error("Welcome email failed (Google signup):", err.message);
  }

  const token = generateToken(user._id);
  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: { user, token },
  });
});

/**
 * @desc    Request a login OTP by email
 * @route   POST /api/auth/login-otp/request
 * @access  Public
 */
const requestLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  const successResponse = {
    success: true,
    message: "If an account with that email exists, we've sent a login code.",
  };

  if (!user || user.isActive === false) {
    return res.status(200).json(successResponse);
  }

  await checkEmailRateLimit(user._id, "login-otp");
  const otp = user.createOtp("login");
  await user.save({ validateBeforeSave: false });

  try {
    const emailContent = otpEmail({ name: user.name, otp, action: "login" });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  await logEmailSent(user._id, "login-otp");
  } catch (err) {
    console.error("Login OTP email failed:", err.message);
    throw new ApiError(500, "Could not send login code. Please try again.");
  }

  return res.status(200).json(successResponse);
});

/**
 * @desc    Verify login OTP and issue JWT
 * @route   POST /api/auth/login-otp/verify
 * @access  Public
 */
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email?.trim() || !otp?.trim()) {
    throw new ApiError(400, "Email and code are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+otpHash +otpAction +otpExpires +otpAttempts"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or code");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "This account has been deactivated. Please contact support.");
  }

  if (!user.otpHash || !user.otpExpires || user.otpAction !== "login") {
    throw new ApiError(400, "No active login code. Request a new one.");
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

  user.otpHash = undefined;
  user.otpAction = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
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


// ── completeOnboarding ─────────────────────────────────────────────
/**
 * @desc    Save onboarding answers and mark complete
 * @route   PATCH /api/auth/onboarding
 * @access  Private
 *
 * Appendix 1 fields (phone, dob, postcode) are normally collected at
 * registration for EMAIL signups. GOOGLE signups skip the register form,
 * so those fields arrive here instead (via Onboarding "Step 0").
 *
 * We only validate + persist Appendix 1 fields if the user is MISSING them.
 * Appendix 2 (carer questions) are handled as before.
 */
const completeOnboarding = asyncHandler(async (req, res) => {
  const user = req.user;

  // Already onboarded — idempotent
  if (user.onboardingComplete) {
    return res.status(200).json({
      success: true,
      message: "Onboarding already complete.",
      data: { user },
    });
  }

  const isEmployerOnly =
    user.roles.includes("employer") &&
    !user.roles.includes("carer") &&
    !user.roles.includes("admin");

  // ── Appendix 1 backfill (Google users) ───────────────────────────
  // Only required/validated if the user doesn't already have them.
  const needsPhone    = !user.phone;
  const needsDob      = !user.dob;
  const needsPostcode = !user.postcode;

  const { phone, dob, postcode } = req.body;

  if (needsPhone) {
    if (!phone?.trim()) throw new ApiError(400, "Phone number is required.");
    const phoneClean = phone.replace(/\s/g, "");
    if (!/^(\+?61|0)[2-9]\d{8}$/.test(phoneClean)) {
      throw new ApiError(
        400,
        "Please enter a valid Australian phone number (e.g. 0412 345 678)."
      );
    }
    user.phone = phoneClean;
  }

  if (needsDob) {
    if (!dob) throw new ApiError(400, "Date of birth is required.");
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      throw new ApiError(400, "Invalid date of birth.");
    }
    const minAge = new Date();
    minAge.setFullYear(minAge.getFullYear() - 16);
    if (dobDate > minAge) {
      throw new ApiError(400, "You must be at least 16 years old to use CareAble.");
    }
    user.dob = dobDate;
  }

  if (needsPostcode) {
    if (!postcode?.trim()) throw new ApiError(400, "Postcode is required.");
    if (!/^\d{4}$/.test(postcode.trim())) {
      throw new ApiError(400, "Please enter a valid 4-digit Australian postcode.");
    }
    user.postcode = postcode.trim();
  }

  // Employer-only somehow not marked complete — fix it (after Appendix 1 backfill)
  if (isEmployerOnly) {
    user.onboardingComplete = true;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Onboarding complete.",
      data: { user },
    });
  }

  // ── Appendix 2 — carer questions (all optional but should be sent) ──
  const {
    employmentStatus,
    lookingForWork,
    appliedForJobRecently,
    industryInterests,

    speaksOtherLanguage,
    primaryLanguage,

    heardAboutFrom,
    careReason,
    careRecipientRelation,
    careRecipientAgeBand,
    careRecipientConditions,
    caregivingDuration,
  } = req.body;

  const VALID_EMPLOYMENT = ["full-time", "part-time", "casual", "none"];
  if (employmentStatus && !VALID_EMPLOYMENT.includes(employmentStatus)) {
    throw new ApiError(400, "Invalid employment status.");
  }

  if (employmentStatus !== undefined)        user.employmentStatus = employmentStatus;
  if (lookingForWork !== undefined)          user.lookingForWork = !!lookingForWork;
  if (appliedForJobRecently !== undefined)   user.appliedForJobRecently = !!appliedForJobRecently;
  if (Array.isArray(industryInterests))      user.industryInterests = industryInterests;

  if (speaksOtherLanguage !== undefined)     user.speaksOtherLanguage = !!speaksOtherLanguage;
  if (primaryLanguage !== undefined)         user.primaryLanguage = primaryLanguage || null;

  if (heardAboutFrom !== undefined)          user.heardAboutFrom = heardAboutFrom || null;
  if (careReason !== undefined)              user.careReason = careReason || null;
  if (careRecipientRelation !== undefined)   user.careRecipientRelation = careRecipientRelation || null;
  if (careRecipientAgeBand !== undefined)    user.careRecipientAgeBand = careRecipientAgeBand || null;
  if (Array.isArray(careRecipientConditions)) user.careRecipientConditions = careRecipientConditions;
  if (caregivingDuration !== undefined)      user.caregivingDuration = caregivingDuration || null;

  user.onboardingComplete = true;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Welcome to CareAble! 🎉",
    data: { user },
  });
});


// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  register,
  login,
  googleLogin,
  googleRegister,
  requestLoginOtp,
  verifyLoginOtp,
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
  completeOnboarding,
};
