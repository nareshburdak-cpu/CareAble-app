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


module.exports = { register, login, getMe }; 