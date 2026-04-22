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

module.exports = mongoose.model("User", userSchema);