/** @file Route definitions for authentication, registration, OTP, and profile actions. */
const express = require("express");
const { body, validationResult } = require("express-validator");

const {
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
  requestLoginOtp,
  verifyLoginOtp,
  googleLogin,
  googleRegister,
  completeOnboarding,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const ApiError = require("../utils/ApiError");

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return next(new ApiError(400, firstError));
  }
  next();
};

// ---- Public ----
router.post("/register", register);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);
router.post(
  "/google/login",
  [
    body("credential")
      .trim()
      .notEmpty().withMessage("Google credential is required"),
  ],
  validate,
  googleLogin
);
router.post(
  "/google/register",
  [
    body("credential")
      .trim()
      .notEmpty().withMessage("Google credential is required"),
    body("roles")
      .optional()
      .isArray().withMessage("Roles must be an array"),
    body("acceptedTerms")
      .optional()
      .isBoolean().withMessage("acceptedTerms must be true or false"),
    body("consentToResearch")
      .optional()
      .isBoolean().withMessage("consentToResearch must be true or false"),
  ],
  validate,
  googleRegister
);
router.post(
  "/google",
  [
    body("credential")
      .trim()
      .notEmpty().withMessage("Google credential is required"),
    body("roles")
      .optional()
      .isArray().withMessage("Roles must be an array"),
    body("acceptedTerms")
      .optional()
      .isBoolean().withMessage("acceptedTerms must be true or false"),
    body("consentToResearch")
      .optional()
      .isBoolean().withMessage("consentToResearch must be true or false"),
  ],
  validate,
  googleRegister
);
router.post(
  "/login-otp/request",
  [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Please provide a valid email")
      .normalizeEmail(),
  ],
  validate,
  requestLoginOtp
);
router.post(
  "/login-otp/verify",
  [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("otp")
      .trim()
      .notEmpty().withMessage("Code is required")
      .isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
  ],
  validate,
  verifyLoginOtp
);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
// ---- Protected ----
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);
router.patch("/password", protect, changePassword);
router.delete("/me", protect, deleteAccount);
router.post("/resend-verification", protect, resendVerification);
router.post("/request-otp", protect, requestOtp);
router.post("/verify-otp", protect, verifyOtp);
router.patch("/onboarding", protect, completeOnboarding);


module.exports = router;
