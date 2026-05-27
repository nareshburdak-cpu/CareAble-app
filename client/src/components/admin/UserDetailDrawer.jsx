import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import { useAuth } from "../../hooks/useAuth";

const MANAGEABLE_ROLES = [
  { key: "carer", label: "Carer" },
  { key: "employer", label: "Employer" },
  { key: "admin", label: "Admin" },
];

const ROLE_COLORS = {
  carer: "bg-emerald-100 text-emerald-700",
  employer: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
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
      if (e.key === "Escape" && !actionLoading) onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [actionLoading, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
    const label = MANAGEABLE_ROLES.find((role) => role.key === roleKey)?.label || roleKey;
    const confirmMessage =
      roleKey === "admin"
        ? "Grant admin access to this user? They will gain full admin privileges."
        : `Add the ${label} role to this user?`;
    handleAction({ addRole: roleKey }, confirmMessage);
  };

  const handleRemoveRole = (roleKey) => {
    const label = MANAGEABLE_ROLES.find((role) => role.key === roleKey)?.label || roleKey;
    handleAction({ removeRole: roleKey }, `Remove the ${label} role from this user?`);
  };

  const userRoles = user?.roles || [];
  const submittedCount = assessments.filter((assessment) => assessment.status === "submitted").length;
  const latestAssessment = assessments[0];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-900/45 backdrop-blur-sm"
        onClick={() => {
          if (!actionLoading) onClose();
        }}
      />

      <div
        className="fixed inset-0 z-50 overflow-hidden bg-stone-50 shadow-[0_28px_90px_rgba(15,23,42,0.22)] md:inset-y-6 md:right-6 md:left-auto md:w-[min(860px,calc(100vw-3rem))] md:rounded-[1.5rem] md:border md:border-white/70"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#faf7ff_100%)] px-4 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:py-3.5 md:pt-3.5">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Admin panel</p>
              <h2 id="user-drawer-title" className="mt-0.5 text-lg font-semibold text-stone-900 md:mt-1 md:text-xl">
                User details
              </h2>
              {!loading && user && <p className="mt-0.5 text-[11px] text-stone-400">Account control</p>}
            </div>
            <button
              onClick={onClose}
              disabled={actionLoading}
              className="rounded-full border border-stone-200 bg-white p-1.5 text-stone-500 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 md:p-2"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            {loading || !user ? (
              <p className="text-sm text-stone-500">Loading...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <section className="space-y-4">
                  <div className="rounded-[1.35rem] border border-stone-200 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#faf7ff_100%)] p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
                        {user.name?.split(" ").map((name) => name[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xl font-semibold leading-tight text-stone-900">{user.name}</h3>
                        <p className="truncate text-sm text-stone-500">{user.email}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {userRoles.map((role) => (
                            <span
                              key={role}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[role] || "bg-stone-100 text-stone-700"}`}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>
                          ))}
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              user.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {user.emailVerified ? "Verified" : "Unverified"}
                          </span>
                          {user.isActive === false && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              Deactivated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <StatTile label="Joined" value={formatDate(user.createdAt)} />
                    <StatTile label="Last login" value={formatDate(user.lastLoginAt)} />
                    <StatTile label="Assessments" value={assessments.length} />
                    <StatTile label="Submitted" value={submittedCount} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {!user.emailVerified && (
                      <ActionTile
                        label="Force-verify email"
                        hint="Skip email verification"
                        onClick={() => handleAction({ emailVerified: true })}
                        disabled={actionLoading}
                      />
                    )}

                    {!isSelf &&
                      (user.isActive === false ? (
                        <ActionTile
                          label="Reactivate account"
                          hint="Allow login again"
                          onClick={() => handleAction({ isActive: true })}
                          disabled={actionLoading}
                          variant="success"
                        />
                      ) : (
                        <ActionTile
                          label="Deactivate account"
                          hint="Block sign-in"
                          onClick={() =>
                            handleAction(
                              { isActive: false },
                              "Deactivate this account? The user will not be able to log in, but their data will be preserved."
                            )
                          }
                          disabled={actionLoading}
                          variant="danger"
                        />
                      ))}
                  </div>

                  {isSelf && (
                    <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-xs italic text-stone-500">
                      You cannot deactivate your own account or remove your own admin role.
                    </p>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-sm">
                    <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Role management</p>
                    </div>
                    <div className="grid gap-px bg-stone-100">
                      {MANAGEABLE_ROLES.map((roleObj) => {
                        const hasThisRole = userRoles.includes(roleObj.key);
                        const isSelfAdmin = isSelf && roleObj.key === "admin";

                        return (
                          <div key={roleObj.key} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[roleObj.key] || ""}`}>
                                  {roleObj.label}
                                </span>
                                <span className="text-xs text-stone-400">{hasThisRole ? "Active" : "Available"}</span>
                              </div>
                            </div>

                            {isSelfAdmin ? (
                              <span className="text-[11px] italic text-stone-400">Locked</span>
                            ) : hasThisRole ? (
                              <button
                                onClick={() => handleRemoveRole(roleObj.key)}
                                disabled={actionLoading || userRoles.length === 1}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title={userRoles.length === 1 ? "Cannot remove the last role" : `Remove ${roleObj.label} role`}
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddRole(roleObj.key)}
                                disabled={actionLoading}
                                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Latest assessment</p>
                      <span className="text-[11px] text-stone-400">{assessments.length} total</span>
                    </div>

                    {latestAssessment ? (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-stone-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-900">
                                {latestAssessment.status === "submitted"
                                  ? latestAssessment.level || "Submitted"
                                  : "In progress"}
                              </p>
                              <p className="mt-1 text-xs text-stone-500">
                                {formatDate(latestAssessment.submittedAt || latestAssessment.updatedAt)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                latestAssessment.status === "submitted"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {latestAssessment.status}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <MiniStat label="Score" value={latestAssessment.overallScore != null ? `${latestAssessment.overallScore.toFixed(2)} / 5` : "-"} />
                            <MiniStat label="Certificate" value={latestAssessment.certificateId || "-"} mono />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-stone-50 px-3 py-4 text-sm text-stone-500">No assessments yet.</div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-[1rem] border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className={`mt-1 truncate text-xs font-medium text-stone-800 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ActionTile({ label, hint, onClick, disabled, variant = "default" }) {
  const variants = {
    default: "border-stone-200 bg-white hover:border-indigo-300 hover:bg-indigo-50",
    success: "border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:border-emerald-400",
    danger: "border-red-200 bg-red-50/60 text-red-800 hover:border-red-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[1rem] border p-3 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.default}`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </button>
  );
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default UserDetailDrawer;
