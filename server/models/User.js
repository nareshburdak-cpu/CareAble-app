// server/models/User.js

/**
 * User Model
 * ----------
 * Defines the shape of users in MongoDB.
 *
 * Phase 12-A: Multi-role architecture.
 *   - `roles` array is the source of truth: ["carer"] | ["admin", "carer"] | ["employer"] | etc.
 *   - `role` string kept for backward compat (JWT, existing middleware during transition).
 *     Computed as: admin > employer > carer priority order.
 *   - New users default to roles: ["carer"].
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyToken: {
      type: String,
      select: false,
    },

    emailVerifyExpires: {
      type: Date,
      select: false,
    },

    // ── Multi-role (Phase 12-A) ──────────────────────────────────
    // Source of truth. Allowed values: "carer" | "employer" | "admin"
    // A user can hold multiple roles simultaneously.
    // Middleware checks roles.includes("admin") etc.
    roles: {
      type: [String],
      enum: ["carer", "employer", "admin"],
      default: ["carer"],
      index: true,
    },

    // Legacy single-role field — kept for JWT compat and existing
    // middleware during transition. Always derived from `roles`:
    //   admin in roles   → "admin"
    //   employer in roles → "employer"
    //   otherwise        → "user"   (maps old "user" to carer)
    // Updated by authController on register/login and by adminController
    // on role changes. Do NOT use as source of truth in new code.
    role: {
      type: String,
      enum: ["user", "admin", "employer"],
      default: "user",
      index: true,
    },

    isCarer: {
      type: Boolean,
      default: false,
    },

    hasCompletedAssessment: {
      type: Boolean,
      default: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    otpHash: {
      type: String,
      select: false,
    },
    otpAction: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
    },

    // Collected in the post-registration onboarding wizard.
    // `name` is always kept in sync as the display name.

    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    // True when user selected "I go by a single name"
    useSingleName: {
      type: Boolean,
      default: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    dob: {
      type: Date,
    },

    postcode: {
      type: String,
      trim: true,
    },

    acceptedTerms: {
      type: Boolean,
      default: false,
    },

    consentToResearch: {
      type: Boolean,
      default: false,
    },

    onboardingComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Filled in via the /onboarding wizard (carer flow only).

    // Hidden worker status
    employmentStatus: {
      type: String,
      enum: ["full-time", "part-time", "casual", "none", null],
      default: null,
    },
    lookingForWork: {
      type: Boolean,
      default: null,
    },
    appliedForJobRecently: {
      type: Boolean,
      default: null,
    },
    industryInterests: {
      type: [String],
      default: [],
    },

    // CALD status
    speaksOtherLanguage: {
      type: Boolean,
      default: null,
    },
    primaryLanguage: {
      type: String,
      default: null,
    },

    // Caregiving information
    heardAboutFrom: {
      type: String,
      default: null,
    },
    careReason: {
      type: String,
      default: null,
    },
    careRecipientRelation: {
      type: String,
      default: null,
    },
    careRecipientAgeBand: {
      type: String,
      default: null,
    },
    careRecipientConditions: {
      type: [String],
      default: [],
    },
    caregivingDuration: {
      type: String,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Derive the legacy `role` string from the `roles` array.
 * Priority: admin > employer > carer (→ "user")
 * Call this whenever roles array changes, then save.
 */
userSchema.methods.syncLegacyRole = function () {
  if (this.roles.includes("admin")) {
    this.role = "admin";
  } else if (this.roles.includes("employer")) {
    this.role = "employer";
  } else {
    this.role = "user";
  }
};

// ── Pre-save: hash password ───────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance methods ──────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createEmailVerifyToken = function () {
  const verifyToken = crypto.randomBytes(32).toString("hex");
  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");
  this.emailVerifyExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return verifyToken;
};

userSchema.methods.createOtp = function (action) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  this.otpAction = action;
  this.otpExpires = Date.now() + 10 * 60 * 1000;
  this.otpAttempts = 0;
  return otp;
};

module.exports = mongoose.model("User", userSchema);