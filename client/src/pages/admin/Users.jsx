/**
 * Admin: Users Management
 * ------------------------
 * Paginated list with search, filter, and a detail drawer for actions.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import UserDetailDrawer from "../../components/admin/UserDetailDrawer";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
  { key: "admins", label: "Admins" },
  { key: "deactivated", label: "Deactivated" },
];

function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Debounce search — wait 300ms after typing stops before firing the API
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search change
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch users from backend
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: {
          page,
          limit: 20,
          search: debouncedSearch,
          filter,
        },
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

  // After an admin action in the drawer, refresh the list
  const handleUserUpdated = () => {
    fetchUsers();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
          Users
        </h1>
        <p className="text-stone-600">
          Manage platform users — search, view, verify, deactivate.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-lg">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  filter === f.key
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-stone-500">No users match your search.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-6 py-3 text-left font-medium">User</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium hidden md:table-cell">Joined</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <UserRow
                  key={u._id}
                  user={u}
                  onView={() => setSelectedUserId(u._id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={handleUserUpdated}
        />
      )}
    </div>
  );
}

// ---- User row ----
function UserRow({ user, onView }) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const joined = new Date(user.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className="hover:bg-stone-50 transition cursor-pointer" onClick={onView}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {user.role === "admin" && (
            <Badge color="purple">Admin</Badge>
          )}
          {user.emailVerified ? (
            <Badge color="emerald">Verified</Badge>
          ) : (
            <Badge color="amber">Unverified</Badge>
          )}
          {user.isActive === false && (
            <Badge color="red">Deactivated</Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-stone-500 hidden md:table-cell">
        {joined}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View →
        </button>
      </td>
    </tr>
  );
}

// ---- Status badge ----
function Badge({ color, children }) {
  const colors = {
    purple: "bg-purple-100 text-purple-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

export default Users;