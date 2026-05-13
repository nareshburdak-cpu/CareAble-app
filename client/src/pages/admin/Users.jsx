/**
 * Admin: Users Management
 * ------------------------
 * Desktop: polished table with richer row design, stat strip, better search/filter UX
 * Mobile: card list instead of table (no overflow, full info visible)
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import UserDetailDrawer from "../../components/admin/UserDetailDrawer";

const FILTERS = [
  { key: "all",         label: "All",         icon: "👥" },
  { key: "verified",    label: "Verified",     icon: "✓"  },
  { key: "unverified",  label: "Unverified",   icon: "!"  },
  { key: "admins",      label: "Admins",       icon: "🛡️" },
  { key: "deactivated", label: "Deactivated",  icon: "✕"  },
];

/* ─── role priority helper ───────────────────────────────────────── */
function getRoles(user) {
  const roles = [];
  if (user.roles?.includes("admin") || user.role === "admin") roles.push("admin");
  if (user.roles?.includes("employer")) roles.push("employer");
  if (user.roles?.includes("carer"))   roles.push("carer");
  return roles;
}

/* ─── avatar ─────────────────────────────────────────────────────── */
function Avatar({ name, size = "md" }) {
  const initials = (name || "?")
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const sz = size === "lg" ? "w-11 h-11 text-sm" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

/* ─── status badges ──────────────────────────────────────────────── */
const BADGE_STYLES = {
  admin:       "bg-purple-100 text-purple-700 border border-purple-200",
  employer:    "bg-blue-100 text-blue-700 border border-blue-200",
  carer:       "bg-stone-100 text-stone-600 border border-stone-200",
  verified:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  unverified:  "bg-amber-100 text-amber-700 border border-amber-200",
  deactivated: "bg-red-100 text-red-700 border border-red-200",
};

function Badge({ type, children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${BADGE_STYLES[type] || BADGE_STYLES.carer}`}>
      {children}
    </span>
  );
}

function UserBadges({ user }) {
  const roles = getRoles(user);
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r} type={r}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </Badge>
      ))}
      {user.emailVerified
        ? <Badge type="verified">Verified</Badge>
        : <Badge type="unverified">Unverified</Badge>
      }
      {user.isActive === false && <Badge type="deactivated">Deactivated</Badge>}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
function Users() {
  const [users, setUsers]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter]         = useState("all");
  const [page, setPage]             = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { page, limit: 20, search: debouncedSearch, filter },
      });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="p-4 md:p-10 space-y-4">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-1">
            Users
          </h1>
          <p className="text-sm text-stone-500">
            Manage platform users — search, view, verify, deactivate.
          </p>
        </div>
        {/* Live total pill */}
        <div className="shrink-0 mt-1 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700">
          {pagination.total} total
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────────── */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filter === f.key
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                : "bg-white border border-stone-200 text-stone-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12">
          <LoadingSpinner message="Loading users…" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-stone-600 font-medium">No users found</p>
          <p className="text-sm text-stone-400 mt-1">
            Try a different search term or filter.
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── DESKTOP TABLE — hidden on mobile ──────────────────── */}
          <div className="hidden md:block bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <DesktopRow
                    key={u._id}
                    user={u}
                    onView={() => setSelectedUserId(u._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARD LIST — hidden on desktop ──────────────── */}
          <div className="md:hidden bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-stone-100">
            {users.map((u) => (
              <MobileCard
                key={u._id}
                user={u}
                onView={() => setSelectedUserId(u._id)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            Page <span className="font-medium text-stone-700">{pagination.page}</span> of{" "}
            <span className="font-medium text-stone-700">{pagination.totalPages}</span>
            {" "}· {pagination.total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              Next
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────────────── */}
      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}

/* ── Desktop table row ────────────────────────────────────────────── */
function DesktopRow({ user, onView }) {
  const joined = new Date(user.createdAt).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <tr
      className="hover:bg-indigo-50/30 transition cursor-pointer group"
      onClick={onView}
    >
      {/* User */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Status badges */}
      <td className="px-5 py-3.5">
        <UserBadges user={user} />
      </td>

      {/* Joined */}
      <td className="px-5 py-3.5">
        <span className="text-xs text-stone-500">{joined}</span>
      </td>

      {/* Action */}
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-xs font-medium rounded-lg group-hover:border-indigo-300 group-hover:text-indigo-600 transition shadow-sm"
        >
          View
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

/* ── Mobile card ──────────────────────────────────────────────────── */
function MobileCard({ user, onView }) {
  const joined = new Date(user.createdAt).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-indigo-50/30 active:bg-indigo-50 transition cursor-pointer"
      onClick={onView}
    >
      <Avatar name={user.name} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-stone-900 truncate leading-tight">
            {user.name}
          </p>
        </div>
        <p className="text-xs text-stone-400 truncate mb-1.5">{user.email}</p>
        <UserBadges user={user} />
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
        <p className="text-[10px] text-stone-400">{joined}</p>
        <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export default Users;