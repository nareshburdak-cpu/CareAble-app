/**
 * UserDetailDrawer
 * ----------------
 * Slide-in panel showing user details + admin actions.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import { useAuth } from "../../hooks/useAuth";

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

  // Close on ESC
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
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

                <div className="flex flex-wrap gap-1 justify-center mt-3">
                  {user.role === "admin" && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                      Admin
                    </span>
                  )}
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

              {/* Recent assessments */}
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
                            {a.status === "submitted" ? `${a.level} · ${a.overallScore}/100` : "In progress"}
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
                <div className="space-y-2">
                  {!user.emailVerified && (
                    <ActionButton
                      onClick={() => handleAction({ emailVerified: true })}
                      disabled={actionLoading}
                      icon="✓"
                      label="Force-verify email"
                      hint="Skip email verification for this user"
                    />
                  )}

                  {user.role === "user" ? (
                    <ActionButton
                      onClick={() => handleAction(
                        { role: "admin" },
                        "Promote this user to admin? They will gain full admin access."
                      )}
                      disabled={actionLoading}
                      icon="⬆"
                      label="Promote to admin"
                      hint="Grant admin privileges"
                    />
                  ) : (
                    !isSelf && (
                      <ActionButton
                        onClick={() => handleAction(
                          { role: "user" },
                          "Demote this admin to a regular user?"
                        )}
                        disabled={actionLoading}
                        icon="⬇"
                        label="Demote to user"
                        hint="Remove admin privileges"
                      />
                    )
                  )}

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
                      ℹ️ You can't deactivate or demote yourself.
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

// ---- Helpers ----
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
    danger: "border-red-200 hover:border-red-400 hover:bg-red-50 text-red-700",
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