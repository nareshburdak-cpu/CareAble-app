// client/src/pages/Profile.jsx

/**
 * Profile Page — mobile-first compact redesign
 * --------------------------------------------
 * Card heights tightened, padding reduced on mobile.
 * Heavy desktop layouts only expand on md+ breakpoints.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "../utils/toast";

import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";
import OtpModal from "../components/OtpModal";

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

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
    ? new Date(user.createdAt).toLocaleDateString("en-AU", { month: "short", year: "numeric" })
    : "—";

  return (
    <section className="flex-1 px-3 py-4 md:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto space-y-3 md:space-y-5">

        {/* ── Compact header card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-base md:text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
                {user?.name}
              </h1>
              <p className="text-xs md:text-sm text-gray-500 truncate">{user?.email}</p>
              {user?.roles?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-indigo-100 text-indigo-700"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inline stats row */}
          {!loadingStats && stats && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
              <InlineStat label="Member" value={memberSince} />
              <InlineStat label="Submitted" value={stats.submitted} />
              <InlineStat label="Latest" value={stats.latestLevel} />
            </div>
          )}
        </div>

        {/* ── Edit profile ──────────────────────────────────── */}
        <EditNameCard />

        {/* ── Default role (multi-role only) ────────────────── */}
        <DefaultRoleCard />

        {/* ── Change password ───────────────────────────────── */}
        <ChangePasswordCard />

        {/* ── Danger zone ───────────────────────────────────── */}
        <DeleteAccountCard onDeleted={() => { logout(); navigate("/"); }} />
      </div>
    </section>
  );
}

// ── Inline compact stat ─────────────────────────────────────
function InlineStat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm md:text-base font-bold text-gray-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ── Collapsible card wrapper ────────────────────────────────
function Card({ title, subtitle, children, danger = false }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 md:p-6 ${
      danger ? "border-red-200" : "border-gray-100"
    }`}>
      <div className="mb-3 md:mb-4">
        <h2 className={`text-base md:text-lg font-semibold ${
          danger ? "text-red-600" : "text-gray-900"
        }`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Default role pills ──────────────────────────────────────
const ROLE_META = {
  carer:    { label: "Carer",    icon: "🤝" },
  employer: { label: "Employer", icon: "🏢" },
  admin:    { label: "Admin",    icon: "⚙️" },
};

function DefaultRoleCard() {
  const { user, activeRole, preferredRole, switchRole, setPreferredRole, roleDestination } = useAuth();
  const navigate = useNavigate();

  if (!user?.roles || user.roles.length <= 1) return null;

  const handleSelect = (role) => {
    setPreferredRole(role);
    switchRole(role);
    toast.success(`Default role: ${ROLE_META[role]?.label}`);
    navigate(roleDestination(role));
  };

  return (
    <Card title="Default Role" subtitle="Which portal you land on after login.">
      <div className="flex flex-wrap gap-1.5">
        {user.roles.map((role) => {
          const meta = ROLE_META[role];
          const active = role === (preferredRole || activeRole);
          if (!meta) return null;

          return (
            <button
              key={role}
              type="button"
              onClick={() => handleSelect(role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                active
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              {active && (
                <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Edit name ───────────────────────────────────────────────
function EditNameCard() {
  const { user } = useAuth();
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
      const updatedUser = res.data.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated 🎉");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormInput
          label="Full name"
          name="name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          error={error}
          autoComplete="name"
        />
        <div>
          <FormInput
            label="Email"
            name="email"
            value={user?.email || ""}
            onChange={() => {}}
            disabled
            readOnly
          />
          <p className="text-xs text-gray-400 -mt-2">
            Email cannot be changed
          </p>
        </div>
        <button
          type="submit"
          disabled={!dirty || isSubmitting}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Card>
  );
}

// ── Change password ─────────────────────────────────────────
function ChangePasswordCard() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShowOtp(true);
  };

  const handleOtpVerified = async (otpToken) => {
    setIsSubmitting(true);
    try {
      await api.patch("/auth/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        otpToken,
      });
      toast.success("Password updated 🔐");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowOtp(false);
      setExpanded(false);
    } catch (err) {
      toast.error(err.message);
      if (err.message.toLowerCase().includes("current password")) {
        setErrors({ currentPassword: err.message });
      }
      setShowOtp(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm md:text-base font-semibold text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-4 md:px-6 md:pb-6 pt-1 border-t border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-3 mt-4">
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
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition"
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>

      {showOtp && (
        <OtpModal
          action="change-password"
          title="Confirm password change"
          onVerified={handleOtpVerified}
          onClose={() => setShowOtp(false)}
        />
      )}
    </>
  );
}

// ── Delete account ──────────────────────────────────────────
function DeleteAccountCard({ onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const handleDelete = (e) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password to confirm");
      return;
    }
    setShowOtp(true);
  };

  const handleOtpVerified = async (otpToken) => {
    setIsSubmitting(true);
    try {
      await api.delete("/auth/me", {
        data: { password, otpToken },
      });
      toast.success("Your account has been deleted.");
      onDeleted();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      setShowOtp(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-red-50/40 transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm md:text-base font-semibold text-red-600">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently remove your account</p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-red-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-red-100">
            <div className="bg-red-50 rounded-xl p-3 mt-4 mb-3">
              <p className="text-sm text-red-800 leading-relaxed">
                ⚠️ <strong>This is permanent.</strong> All your data — assessments, certificates, and account info — will be deleted forever.
              </p>
            </div>

            <form onSubmit={handleDelete} className="space-y-3">
              <FormInput
                label="Confirm with your password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                error={error}
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-300 transition"
                >
                  {isSubmitting ? "Deleting..." : "Delete forever"}
                </button>
                <button
                  type="button"
                  onClick={() => { setExpanded(false); setPassword(""); setError(""); }}
                  className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showOtp && (
        <OtpModal
          action="delete-account"
          title="Confirm account deletion"
          onVerified={handleOtpVerified}
          onClose={() => setShowOtp(false)}
        />
      )}
    </>
  );
}

export default Profile;
