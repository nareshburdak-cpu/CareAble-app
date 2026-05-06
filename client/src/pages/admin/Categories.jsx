// client/src/pages/admin/Categories.jsx

/**
 * Admin: Category Management
 * --------------------------
 * Add, edit, archive, restore, and reorder capability domains.
 *
 * Categories are the top-level grouping for assessment questions. The 12
 * brief-aligned defaults are seeded; admins can extend or modify them here.
 *
 * Constraints (enforced server-side, surfaced as errors):
 *   - A category's `key` becomes immutable once any question or assessment
 *     references it. Display fields (label, description, icon, colour)
 *     remain editable.
 *   - Archived categories are hidden from new assessments but retained for
 *     historical lookups.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
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
  const [editingCategory, setEditingCategory] = useState(null); // null | {} (new) | category object
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

  const handleArchive = async (cat) => {
    if (!cat.isArchived) {
      // Archive — show count of questions that will be hidden
      const qCount = cat.questionCount || 0;
      const msg = qCount > 0
        ? `Archive "${cat.label}"? ${qCount} active question${qCount !== 1 ? "s" : ""} will be hidden from new assessments. In-progress assessments are unaffected.`
        : `Archive "${cat.label}"? It has no active questions, so nothing else changes.`;
      if (!window.confirm(msg)) return;
    }

    setActionLoading(cat._id);
    try {
      const endpoint = cat.isArchived ? "restore" : "archive";
      const res = await api.post(`/admin/categories/${cat._id}/${endpoint}`);
      toast.success(res.data.message || (cat.isArchived ? "Category restored." : "Category archived."));
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (cat, direction) => {
    setActionLoading(cat._id);
    try {
      await api.post(`/admin/categories/${cat._id}/reorder`, { direction });
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Reorder failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  // Active categories first (in order), then archived (in order, only if toggled)
  const visibleCategories = showArchived
    ? categories.filter((c) => c.isArchived)   // only archived
    : categories.filter((c) => !c.isArchived);  // active only

  // For reorder bounds, we only care about position within the active subset
  const activeKeys = categories.filter((c) => !c.isArchived).map((c) => c._id);

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
            Capability Domains
          </h1>
          <p className="text-stone-600">
            Manage the top-level domains carers are assessed against. The 12 default domains come from the Capstone Brief.
          </p>
        </div>
        <button
          onClick={() => setEditingCategory({})}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
        >
          + Add domain
        </button>
      </div>

      {/* Stats + filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setShowArchived(false)}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition ${
            !showArchived
              ? "bg-emerald-100 border-emerald-400 ring-1 ring-emerald-400"
              : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-800">
            {stats.activeCount} active
          </span>
        </button>

        <button
          onClick={() => setShowArchived(true)}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition ${
            showArchived
              ? "bg-stone-200 border-stone-400 ring-1 ring-stone-400"
              : "bg-stone-100 border-stone-200 hover:bg-stone-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-stone-400" />
          <span className="text-xs font-medium text-stone-700">
            {stats.archivedCount} archived
          </span>
        </button>
      </div>

      {/* List */}
      {visibleCategories.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-2">🗂️</div>
          <p className="text-stone-500">
            {showArchived ? "No categories yet." : "No active categories. Toggle 'Show archived' to see archived ones."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleCategories.map((cat) => {
            const activeIdx = activeKeys.indexOf(cat._id);
            const isFirstActive = activeIdx === 0;
            const isLastActive = activeIdx === activeKeys.length - 1;

            return (
              <CategoryRow
                key={cat._id}
                category={cat}
                isFirstActive={isFirstActive}
                isLastActive={isLastActive}
                onEdit={() => setEditingCategory(cat)}
                onArchive={() => handleArchive(cat)}
                onReorder={(dir) => handleReorder(cat, dir)}
                isLoading={actionLoading === cat._id}
              />
            );
          })}
        </div>
      )}

      {/* Form modal */}
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

// ---- Category row ----
function CategoryRow({ category, isFirstActive, isLastActive, onEdit, onArchive, onReorder, isLoading }) {
  const archived = category.isArchived;
  return (
    <div className={`bg-white border border-stone-200 rounded-2xl overflow-hidden ${archived ? "opacity-60" : ""}`}>
      <div className="px-6 py-4">
        <div className="flex items-start gap-4">
          {/* Reorder buttons (active only) */}
          <div className="flex flex-col gap-1 flex-shrink-0 pt-1">
            <button
              onClick={() => onReorder("up")}
              disabled={archived || isFirstActive || isLoading}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Move up"
              title={archived ? "Restore to reorder" : "Move up"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onReorder("down")}
              disabled={archived || isLastActive || isLoading}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Move down"
              title={archived ? "Restore to reorder" : "Move down"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                {category.icon && <span className="text-xl leading-none">{category.icon}</span>}
                <span>{category.label}</span>
              </h3>
              {archived && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  Archived
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                {category.color}
              </span>
            </div>

            {category.description && (
              <p className="text-sm text-stone-600 mt-1">{category.description}</p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
              <span className="font-mono">{category.key}</span>
              <span>•</span>
              <span>
                {category.questionCount} active question{category.questionCount !== 1 ? "s" : ""}
                {category.archivedQuestionCount > 0 && (
                  <span className="text-stone-400">
                    {" "}({category.archivedQuestionCount} archived)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              disabled={isLoading}
              className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
              aria-label="Edit"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onArchive}
              disabled={isLoading}
              className={`p-2 rounded transition ${
                archived
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-stone-400 hover:text-amber-600 hover:bg-amber-50"
              }`}
              aria-label={archived ? "Restore" : "Archive"}
              title={archived ? "Restore" : "Archive"}
            >
              {archived ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Categories;