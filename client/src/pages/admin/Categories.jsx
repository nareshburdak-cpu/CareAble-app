/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import CategoryFormModal from "../../components/admin/CategoryFormModal";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [allowedColors, setAllowedColors] = useState([]);
  const [stats, setStats] = useState({ total: 0, activeCount: 0, archivedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data.data.categories || []);
      setAllowedColors(res.data.data.allowedColors || []);
      setStats({
        total: res.data.data.total || 0,
        activeCount: res.data.data.activeCount || 0,
        archivedCount: res.data.data.archivedCount || 0,
      });
    } catch (err) {
      toast.error(err.message || "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleArchive = async (category) => {
    if (!category.isArchived) {
      const qCount = category.questionCount || 0;
      const message =
        qCount > 0
          ? `Archive "${category.label}"? ${qCount} active question${qCount !== 1 ? "s" : ""} will be hidden from new assessments.`
          : `Archive "${category.label}"? It has no active questions, so nothing else changes.`;
      if (!window.confirm(message)) return;
    }

    setActionLoading(category._id);
    try {
      const endpoint = category.isArchived ? "restore" : "archive";
      const res = await api.post(`/admin/categories/${category._id}/${endpoint}`);
      toast.success(res.data.message || (category.isArchived ? "Domain restored." : "Domain archived."));
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (category, direction) => {
    setActionLoading(category._id);
    try {
      await api.post(`/admin/categories/${category._id}/reorder`, { direction });
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Reorder failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  const visibleCategories = showArchived
    ? categories.filter((category) => category.isArchived)
    : categories.filter((category) => !category.isArchived);

  const activeIds = categories.filter((category) => !category.isArchived).map((category) => category._id);

  return (
    <div className="mx-auto max-w-[1360px] p-4 md:p-8 xl:p-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-2xl font-bold text-stone-900 md:text-3xl">Capability Domains</h1>
          <p className="max-w-3xl text-sm text-stone-600">
            Manage the top-level domains carers are assessed against. Default domains come from the Capstone Brief and can be extended here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            {stats.total} total
          </div>
          <button
            onClick={() => setEditingCategory({})}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Add domain
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setShowArchived(false)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            !showArchived
              ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
              : "border border-stone-200 bg-white text-stone-600 hover:border-emerald-200 hover:text-emerald-700"
          }`}
        >
          Active {stats.activeCount}
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            showArchived
              ? "border border-stone-300 bg-stone-200 text-stone-700"
              : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          }`}
        >
          Archived {stats.archivedCount}
        </button>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </div>
          <p className="font-medium text-stone-600">
            {showArchived ? "No archived domains yet." : "No active domains available."}
          </p>
          <p className="mt-1 text-sm text-stone-400">
            {showArchived ? "Archived domains will appear here." : "Create a new domain or switch to archived to review older ones."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleCategories.map((category) => {
            const activeIndex = activeIds.indexOf(category._id);
            return (
              <CategoryRow
                key={category._id}
                category={category}
                isFirstActive={activeIndex === 0}
                isLastActive={activeIndex === activeIds.length - 1}
                onEdit={() => setEditingCategory(category)}
                onArchive={() => handleArchive(category)}
                onReorder={(direction) => handleReorder(category, direction)}
                isLoading={actionLoading === category._id}
              />
            );
          })}
        </div>
      )}

      {editingCategory !== null && (
        <CategoryFormModal
          category={editingCategory}
          allowedColors={allowedColors}
          onClose={() => setEditingCategory(null)}
          onSaved={() => {
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}

function CategoryRow({ category, isFirstActive, isLastActive, onEdit, onArchive, onReorder, isLoading }) {
  const archived = category.isArchived;
  const colorPillClass = getColorPillClass(category.color);

  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm ${archived ? "opacity-70" : ""}`}>
      <div className="px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="hidden flex-col gap-1.5 pt-1 md:flex">
            <button
              onClick={() => onReorder("up")}
              disabled={archived || isFirstActive || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-400 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Move up"
              title={archived ? "Restore to reorder" : "Move up"}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onReorder("down")}
              disabled={archived || isLastActive || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-400 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Move down"
              title={archived ? "Restore to reorder" : "Move down"}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start gap-3">
                  {category.icon && (
                    <span className="mt-0.5 shrink-0 text-base leading-none md:text-lg">{category.icon}</span>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold leading-snug text-stone-900 md:text-base">
                        {category.label}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${colorPillClass}`}
                      >
                        {category.color}
                      </span>

                      {archived && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Archived
                        </span>
                      )}
                    </div>

                    {category.description && (
                      <p className="mt-1.5 max-w-3xl text-sm leading-5 text-stone-600">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={onEdit}
                  disabled={isLoading}
                  className="rounded-lg p-2 text-stone-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                  aria-label="Edit"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button
                  onClick={onArchive}
                  disabled={isLoading}
                  className={`rounded-lg p-2 transition ${
                    archived ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                  aria-label={archived ? "Restore" : "Archive"}
                  title={archived ? "Restore" : "Archive"}
                >
                  {archived ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="rounded-full bg-stone-50 px-2.5 py-1 font-mono text-stone-600">{category.key}</span>
              <span className="rounded-full bg-stone-50 px-2.5 py-1 text-stone-600">
                {category.questionCount} active question{category.questionCount !== 1 ? "s" : ""}
              </span>
              {category.archivedQuestionCount > 0 && (
                <span className="text-stone-400">({category.archivedQuestionCount} archived)</span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 md:hidden">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Reorder
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReorder("up")}
                  disabled={archived || isFirstActive || isLoading}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Move up"
                  title={archived ? "Restore to reorder" : "Move up"}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Up
                </button>
                <button
                  onClick={() => onReorder("down")}
                  disabled={archived || isLastActive || isLoading}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Move down"
                  title={archived ? "Restore to reorder" : "Move down"}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Down
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColorPillClass(color) {
  const map = {
    indigo: "bg-indigo-100 text-indigo-700",
    pink: "bg-pink-100 text-pink-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    teal: "bg-teal-100 text-teal-700",
    green: "bg-green-100 text-green-700",
    sky: "bg-sky-100 text-sky-700",
    rose: "bg-rose-100 text-rose-700",
    red: "bg-red-100 text-red-700",
    violet: "bg-violet-100 text-violet-700",
    fuchsia: "bg-fuchsia-100 text-fuchsia-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return map[color] || "bg-stone-100 text-stone-700";
}

export default Categories;
