/**
 * User Model
 * ----------
 * Defines the shape of users in MongoDB.
 *
 * Features:
 *   - Unique email validation
 *   - Password hashing (via bcrypt pre-save hook)
 *   - Password comparison method
 *   - Role-based access (user / admin)
 *   - Auto timestamps (createdAt, updatedAt)
 *   - Password hidden from responses by default
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
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
      select: false, // ❗ Never return password in query results by default
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyToken: {
      type: String,
      select: false,    // hide from default queries
    },

    emailVerifyExpires: {
      type: Date,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // CareAble-specific fields (we'll use later)
    isCarer: {
      type: Boolean,
      default: false,
    },

    hasCompletedAssessment: {
      type: Boolean,
      default: false,
    },

    // Add inside userSchema, near the other fields:
    passwordResetToken: {
      type: String,
      select: false,    // never returned in queries by default
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
  }
);

// ---- Middleware: Hash password before saving ----
// Runs automatically whenever a user is saved (create OR password update)
userSchema.pre("save", async function () {
  // Only hash if the password was modified
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// ---- Instance Method: Compare entered password with hashed password ----
// Used during login: user.matchPassword("plainTextInput")
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ---- Instance Method: Strip sensitive fields when sending user as JSON ----
// Called automatically when you do res.json(user)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};


// Generate a password reset token + return the unhashed version (for the email link)
userSchema.methods.createPasswordResetToken = function () {
  // Generate random unhashed token (this goes in the email)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Save the HASHED version (defense if DB is breached)
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Expires in 30 minutes
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  return resetToken; // unhashed — used in email link only
};

// Generate an email verification token + return the unhashed version (for email link)
userSchema.methods.createEmailVerifyToken = function () {
  const verifyToken = crypto.randomBytes(32).toString("hex");

  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  // Token valid for 7 days (less aggressive than password reset)
  this.emailVerifyExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return verifyToken;
};

module.exports = mongoose.model("User", userSchema);