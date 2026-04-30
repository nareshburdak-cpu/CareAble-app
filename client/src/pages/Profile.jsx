/**
 * Profile Page
 * ------------
 * Lets users view and edit their account:
 *   - Name (editable)
 *   - Email (read-only)
 *   - Member since + stats
 *   - Change password
 *   - Delete account (danger zone)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "../utils/toast";

import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/assessments");
        const assessments = res.data.data.assessments;
        setStats({
          total: assessments.length,
          submitted: assessments.filter((a) => a.status === "submitted").length,
          latestLevel: assessments.find((a) => a.status === "submitted")?.level || "—",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <section className="flex-1 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {user?.name}
              </h1>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Account stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Stats
          </h2>
          {loadingStats ? (
            <p className="text-sm text-gray-400">Loading stats...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatBox label="Member Since" value={memberSince} />
              <StatBox label="Assessments" value={stats?.submitted ?? 0} />
              <StatBox label="Latest Level" value={stats?.latestLevel ?? "—"} />
            </div>
          )}
        </div>

        {/* Edit name */}
        <EditNameCard />

        {/* Change password */}
        <ChangePasswordCard />

        {/* Danger zone */}
        <DeleteAccountCard onDeleted={() => { logout(); navigate("/"); }} />
      </div>
    </section>
  );
}

// ==========================================================================
// Sub-components
// ==========================================================================

function StatBox({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ---- Edit name ----
function EditNameCard() {
  const { user } = useAuth(); // we'll refresh the user by re-fetching /auth/me
  const [name, setName] = useState(user?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const dirty = name.trim() !== user?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Name is required");
    if (name.trim().length < 2) return setError("Name must be at least 2 characters");

    setIsSubmitting(true);
    try {
      const res = await api.patch("/auth/me", { name: name.trim() });
      // Update localStorage + user in AuthContext
      const updatedUser = res.data.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Trigger a full page reload so AuthContext picks up the new user
      // (cleaner alternative: expose a setUser in context; doing the simple thing here)
      toast.success("Profile updated 🎉");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Full name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          error={error}
          autoComplete="name"
        />

        <FormInput
          label="Email"
          name="email"
          value={user?.email || ""}
          onChange={() => {}}
          disabled
          readOnly
        />
        <p className="text-xs text-gray-400 -mt-3 mb-3">
          Email cannot be changed
        </p>

        <button
          type="submit"
          disabled={!dirty || isSubmitting}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

// ---- Change password ----
function ChangePasswordCard() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = "Required";
    if (!formData.newPassword) newErrors.newPassword = "Required";
    else if (formData.newPassword.length < 6) newErrors.newPassword = "At least 6 characters";
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.patch("/auth/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Password updated 🔐");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message);
      if (err.message.toLowerCase().includes("current password")) {
        setErrors({ currentPassword: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Current password"
          name="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          autoComplete="current-password"
        />
        <FormInput
          label="New password"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <FormInput
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

// ---- Delete account (danger zone) ----
function DeleteAccountCard({ onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password to confirm");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.delete("/auth/me", { data: { password } });
      toast.success("Your account has been deleted.");
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-red-100 p-6 md:p-8">
      <h2 className="text-lg font-semibold text-red-600 mb-1">Danger Zone</h2>
      <p className="text-sm text-gray-500 mb-4">
        Deleting your account removes all your data permanently, including assessments and certificates. This cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-6 py-2.5 bg-white text-red-600 font-medium rounded-lg border-2 border-red-200 hover:bg-red-50 transition"
        >
          Delete My Account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium mb-3">
            ⚠️ This is permanent. Enter your password to confirm.
          </p>
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            error={error}
            autoComplete="current-password"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-red-300 transition"
            >
              {isSubmitting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setPassword("");
                setError("");
              }}
              className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;