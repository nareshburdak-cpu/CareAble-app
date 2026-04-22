/**
 * Auth Routes
 * -----------
 *   POST /api/auth/register
 *   POST /api/auth/login
 */

const express = require("express");
const { body, validationResult } = require("express-validator");

const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const ApiError = require("../utils/ApiError");

const router = express.Router();

// ---- Helper: runs validators and forwards errors to error handler ----
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return next(new ApiError(400, firstError));
  }
  next();
};

// ---- POST /api/auth/register ----
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

// ---- POST /api/auth/login ----
router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

// ---- GET /api/auth/me  (protected) ----
router.get("/me", protect, getMe);

module.exports = router;