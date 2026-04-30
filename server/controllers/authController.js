/**
 * Auth Controller
 * ---------------
 * Handles user authentication endpoints:
 *   - register  (POST /api/auth/register)
 *   - login     (POST /api/auth/login)
 *   - getMe     (GET  /api/auth/me)      ← coming in Task 5
 */

const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");
const { welcomeEmail, passwordResetEmail, verifyEmailTemplate, } = require("../utils/emailTemplates");


/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */


const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // ... existing validation ...

  const user = await User.create({ name, email, password });

  // Generate email verification token
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  // Build verification URL
  const clientUrl = process.env.CLIENT_URL || "https://careable.site";
  const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;

  // Send welcome email
  const welcomeContent = welcomeEmail({ name: user.name });
  sendEmail({
    to: user.email,
    subject: welcomeContent.subject,
    html: welcomeContent.html,
  }).catch((err) => console.error("Welcome email failed:", err.message));

  // Send verification email (separate from welcome — different purposes)
  const verifyContent = verifyEmailTemplate({
    name: user.name,
    verifyUrl,
  });
  sendEmail({
    to: user.email,
    subject: verifyContent.subject,
    html: verifyContent.html,
  }).catch((err) => console.error("Verify email failed:", err.message));

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

  // 1. Basic presence check
  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  // 2. Find user — MUST explicitly include password since it's select: false
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // 3. Vague error for security (don't reveal which part is wrong)
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 4. Compare passwords using our model method
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 5. Generate token
  const token = generateToken(user._id);

  // 6. Send response (toJSON strips password)
  res.status(200).json({
    success: true,
    message: "Logged in successfully 👋",
    data: {
      user,
      token,
    },
  });
});

/**
 * @desc    Get current logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT)
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the `protect` middleware
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
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

/**
 * @desc    Change current user's password
 * @route   PATCH /api/auth/password
 * @access  Private
 *
 * Requires current password for security.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new passwords are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  // Fetch user WITH password to verify current
  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save(); // pre-save hook auto-hashes

  res.status(200).json({
    success: true,
    message: "Password updated 🔐",
  });
});

/**
 * @desc    Delete current user's account (and all their assessments)
 * @route   DELETE /api/auth/me
 * @access  Private
 *
 * Requires password confirmation.
 */
  const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required to delete your account");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Password is incorrect");
  }

  // Cascade delete: remove all of this user's assessments
  const Assessment = require("../models/Assessment");
  await Assessment.deleteMany({ user: req.user._id });

  // Delete the user
  await User.findByIdAndDelete(req.user._id);

  res.status(200).json({
    success: true,
    message: "Account deleted. Sorry to see you go 👋",
  });
});

/**
 * @desc    Request a password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 *
 * Always returns success — even if email doesn't exist.
 * Prevents user enumeration attacks.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return same response — don't reveal if email exists
  const successResponse = {
    success: true,
    message:
      "If an account with that email exists, we've sent a password reset link.",
  };

  if (!user) {
    return res.status(200).json(successResponse);
  }

  // Generate token, save hashed version, get unhashed for email
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Build reset URL — uses CLIENT_URL env var (fallback to careable.site)
  const clientUrl = process.env.CLIENT_URL || "https://careable.site";
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  // Send email — fire and forget pattern with error handling
  try {
    const emailContent = passwordResetEmail({
      name: user.name,
      resetUrl,
    });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (err) {
    // If email fails, clear the reset token so user can try again
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Password reset email failed:", err.message);
    throw new ApiError(
      500,
      "Could not send reset email. Please try again later."
    );
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

  // Hash the incoming token to compare with what's in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with matching token AND not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired");
  }

  // Update password (User model's pre-save hook will re-hash it)
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Auto-login: issue a fresh JWT
  const newToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You're now logged in.",
    data: {
      user,
      token: newToken,
    },
  });
});

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

  // Hash the incoming token to match what's in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: { $gt: Date.now() },
  }).select("+emailVerifyToken +emailVerifyExpires");

  if (!user) {
    throw new ApiError(
      400,
      "Verification link is invalid or has expired. Request a new one."
    );
  }

  // Already verified — idempotent (clicking link twice is fine)
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
 * @access  Private (must be logged in)
 */
const resendVerification = asyncHandler(async (req, res) => {
  const user = req.user;   // attached by `protect` middleware

  if (user.emailVerified) {
    throw new ApiError(400, "Your email is already verified.");
  }

  // Generate a fresh token (overwrites old one)
  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "https://careable.site";
  const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;

  try {
    const emailContent = verifyEmailTemplate({
      name: user.name,
      verifyUrl,
    });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (err) {
    console.error("Resend verification failed:", err.message);
    throw new ApiError(500, "Could not send verification email. Try again later.");
  }

  res.status(200).json({
    success: true,
    message: "Verification email sent! Check your inbox.",
  });
});

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
}; 