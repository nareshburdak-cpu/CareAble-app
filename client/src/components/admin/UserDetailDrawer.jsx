// client/src/components/admin/UserDetailDrawer.jsx

/**
 * UserDetailDrawer
 * ----------------
 * Slide-in panel showing user details + admin actions.
 * Phase 12-A: Multi-role — shows roles array, add/remove per role.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import { useAuth } from "../../hooks/useAuth";

// All roles an admin can assign/remove
const MANAGEABLE_ROLES = [
  { key: "carer",    label: "Carer",    color: "emerald" },
  { key: "employer", label: "Employer", color: "blue"    },
  { key: "admin",    label: "Admin",    color: "purple"  },
];

const ROLE_COLORS = {
  carer:    "bg-emerald-100 text-emerald-700",
  employer: "bg-blue-100 text-blue-700",
  admin:    "bg-purple-100 text-purple-700",
};

function UserDetailDrawer({ userId, onClose, onUpdate }) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isSelf = user?._id === currentUser?._id;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setUser(res.data.data.user);
      setAssessments(res.data.data.assessments);
    } catch (err) {
      toast.error(err.message || "Could not load user");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [userId, onClose]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleAction = async (updates, confirmMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${userId}`, updates);
      setUser(res.data.data.user);
      toast.success(res.data.message || "User updated.");
      onUpdate?.();
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRole = (roleKey) => {
    const label = MANAGEABLE_ROLES.find((r) => r.key === roleKey)?.label || roleKey;
    const confirm = roleKey === "admin"
      ? `Grant admin access to this user? They will gain full admin privileges.`
      : `Add the ${label} role to this user?`;
    handleAction({ addRole: roleKey }, confirm);
  };

  const handleRemoveRole = (roleKey) => {
    const label = MANAGEABLE_ROLES.find((r) => r.key === roleKey)?.label || roleKey;
    handleAction(
      { removeRole: roleKey },
      `Remove the ${label} role from this user?`
    );
  };

  const userRoles = user?.roles || [];

  return (
    <>
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-md transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading || !user ? (
            <p className="text-sm text-stone-500">Loading...</p>
          ) : (
            <>
              {/* Profile */}
              <div className="text-center mb-6">
                <div className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-white text-xl font-bold mb-3">
                  {user.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-stone-900">{user.name}</h3>
                <p className="text-sm text-stone-500">{user.email}</p>

                {/* Role badges — shows all roles */}
                <div className="flex flex-wrap gap-1 justify-center mt-3">
                  {userRoles.map((r) => (
                    <span
                      key={r}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[r] || "bg-stone-100 text-stone-700"}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </span>
                  ))}
                  {user.emailVerified ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                      Unverified
                    </span>
                  )}
                  {user.isActive === false && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      Deactivated
                    </span>
                  )}
                </div>
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <InfoCell label="Joined" value={formatDate(user.createdAt)} />
                <InfoCell label="Last login" value={formatDate(user.lastLoginAt)} />
                <InfoCell label="Assessments" value={assessments.length} />
                <InfoCell label="Submitted" value={assessments.filter((a) => a.status === "submitted").length} />
              </div>

              {/* Assessment history */}
              {assessments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-2">
                    Assessment History
                  </h4>
                  <div className="space-y-2">
                    {assessments.slice(0, 5).map((a) => (
                      <div key={a._id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium text-stone-900">
                            {a.status === "submitted"
                              ? `${a.level} · ${a.overallScore != null ? a.overallScore.toFixed(2) : "—"} / 5`
                              : "In progress"}
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatDate(a.submittedAt || a.updatedAt)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          a.status === "submitted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin actions */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-3">
                  Admin Actions
                </h4>
                <div className="space-y-3">

                  {/* Email verification */}
                  {!user.emailVerified && (
                    <ActionButton
                      onClick={() => handleAction({ emailVerified: true })}
                      disabled={actionLoading}
                      icon="✓"
                      label="Force-verify email"
                      hint="Skip email verification for this user"
                    />
                  )}

                  {/* Role management */}
                  <div className="border border-stone-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-stone-50 border-b border-stone-200">
                      <p className="text-xs font-medium text-stone-600 uppercase tracking-wider">
                        Role management
                      </p>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {MANAGEABLE_ROLES.map((roleObj) => {
                        const hasThisRole = userRoles.includes(roleObj.key);
                        const isSelfAdmin = isSelf && roleObj.key === "admin";

                        return (
                          <div key={roleObj.key} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[roleObj.key] || ""}`}>
                                {roleObj.label}
                              </span>
                              {hasThisRole && (
                                <span className="text-xs text-stone-400">active</span>
                              )}
                            </div>
                            {isSelfAdmin ? (
                              <span className="text-xs text-stone-400 italic">Can't modify own</span>
                            ) : hasThisRole ? (
                              <button
                                onClick={() => handleRemoveRole(roleObj.key)}
                                disabled={actionLoading || userRoles.length === 1}
                                className="text-xs px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                                title={userRoles.length === 1 ? "Can't remove last role" : `Remove ${roleObj.label} role`}
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddRole(roleObj.key)}
                                disabled={actionLoading}
                                className="text-xs px-3 py-1 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account status */}
                  {!isSelf && (
                    user.isActive === false ? (
                      <ActionButton
                        onClick={() => handleAction({ isActive: true })}
                        disabled={actionLoading}
                        icon="↻"
                        label="Reactivate account"
                        hint="Allow login again"
                        variant="success"
                      />
                    ) : (
                      <ActionButton
                        onClick={() => handleAction(
                          { isActive: false },
                          "Deactivate this account? The user will not be able to log in. Their data will be preserved."
                        )}
                        disabled={actionLoading}
                        icon="✕"
                        label="Deactivate account"
                        hint="Block this user from logging in"
                        variant="danger"
                      />
                    )
                  )}

                  {isSelf && (
                    <p className="text-xs text-stone-500 italic px-3 py-2 bg-stone-50 rounded-lg">
                      You can't deactivate your own account or remove your admin role.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="bg-stone-50 rounded-lg p-3">
      <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
}

function ActionButton({ onClick, disabled, icon, label, hint, variant = "default" }) {
  const variants = {
    default: "border-stone-200 hover:border-indigo-300 hover:bg-indigo-50",
    success: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700",
    danger:  "border-red-200 hover:border-red-400 hover:bg-red-50 text-red-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 border rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-stone-500">{hint}</p>
        </div>
      </div>
    </button>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default UserDetailDrawer;