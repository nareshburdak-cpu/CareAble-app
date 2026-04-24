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

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Please provide name, email, and password");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully 🎉",
    data: {
      user,
      token,
    },
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


module.exports = { register, login, getMe, updateProfile, changePassword, deleteAccount }; 