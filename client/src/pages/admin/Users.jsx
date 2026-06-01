/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import UserDetailDrawer from "../../components/admin/UserDetailDrawer";
import toast from "../../utils/toast";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
  { key: "admins", label: "Admins" },
  { key: "deactivated", label: "Deactivated" },
];

const BADGE_STYLES = {
  admin: "border border-purple-200 bg-purple-100 text-purple-700",
  employer: "border border-blue-200 bg-blue-100 text-blue-700",
  carer: "border border-stone-200 bg-stone-100 text-stone-600",
  verified: "border border-emerald-200 bg-emerald-100 text-emerald-700",
  unverified: "border border-amber-200 bg-amber-100 text-amber-700",
  deactivated: "border border-red-200 bg-red-100 text-red-700",
};

function getRoles(user) {
  const roles = [];
  if (user.roles?.includes("admin") || user.role === "admin") roles.push("admin");
  if (user.roles?.includes("employer")) roles.push("employer");
  if (user.roles?.includes("carer")) roles.push("carer");
  return roles;
}

function Avatar({ name, size = "md" }) {
  const initials = (name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const classes = size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";

  return (
    <div
      className={`${classes} flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white`}
    >
      {initials}
    </div>
  );
}

function Badge({ type, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[type] || BADGE_STYLES.carer}`}
    >
      {children}
    </span>
  );
}

function UserBadges({ user }) {
  const roles = getRoles(user);

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} type={role}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      ))}

      {user.emailVerified ? (
        <Badge type="verified">Verified</Badge>
      ) : (
        <Badge type="unverified">Unverified</Badge>
      )}

      {user.isActive === false && <Badge type="deactivated">Deactivated</Badge>}
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/users", {
        params: { page, limit: 15, search: debouncedSearch, filter },
      });

      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="mx-auto max-w-[1360px] space-y-4 p-4 md:p-8 xl:p-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-bold text-stone-900 md:text-3xl">Users</h1>
          <p className="text-sm text-stone-500">
            Manage platform users, search accounts, and review account status.
          </p>
        </div>

        <div className="mt-1 shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          {pagination.total} total
        </div>
      </div>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setFilter(item.key);
              setPage(1);
            }}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === item.key
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                : "border border-stone-200 bg-white text-stone-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12">
          <LoadingSpinner message="Loading users..." />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="font-medium text-stone-600">No users found</p>
          <p className="mt-1 text-sm text-stone-400">Try a different search term or filter.</p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-4 text-sm text-indigo-600 hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => (
                  <DesktopRow key={user._id} user={user} onView={() => setSelectedUserId(user._id)} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:hidden">
            {users.map((user) => (
              <MobileCard key={user._id} user={user} onView={() => setSelectedUserId(user._id)} />
            ))}
          </div>
        </>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            Page <span className="font-medium text-stone-700">{pagination.page}</span> of{" "}
            <span className="font-medium text-stone-700">{pagination.totalPages}</span> · {pagination.total} users
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <button
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

function DesktopRow({ user, onView }) {
  const joined = new Date(user.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className="group cursor-pointer transition hover:bg-indigo-50/30" onClick={onView}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-stone-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-stone-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <UserBadges user={user} />
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs text-stone-500">{joined}</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm transition group-hover:border-indigo-300 group-hover:text-indigo-600"
        >
          View
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function MobileCard({ user, onView }) {
  const joined = new Date(user.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition hover:bg-indigo-50/30 active:bg-indigo-50"
      onClick={onView}
    >
      <Avatar name={user.name} size="lg" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-stone-900">{user.name}</p>
        <p className="mb-1.5 truncate text-xs text-stone-400">{user.email}</p>
        <UserBadges user={user} />
      </div>

      <div className="ml-1 flex flex-shrink-0 flex-col items-end gap-1.5">
        <p className="text-xs text-stone-400">{joined}</p>
        <svg className="h-4 w-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export default Users;
