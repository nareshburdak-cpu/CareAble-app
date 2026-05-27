// client/src/pages/admin/Questions.jsx

/**
 * Admin: Question Management
 * --------------------------
 * List, edit, archive, reorder questions across all categories.
 *
 * Three display tiers controlled by pill buttons:
 *
 *   "active"   — non-archived questions in active categories
 *   "archived" — admin-archived questions in active categories
 *   "hidden"   — non-archived questions in archived categories
 *               (read-only; restore the category to make them active)
 *
 * Fetches:
 *   - /api/admin/questions       all questions (incl. admin-archived)
 *   - /api/questions             active categories with metadata, in canonical order
 *   - /api/admin/categories      all categories (incl. archived) with metadata
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import QuestionFormModal from "../../components/admin/QuestionFormModal";

function Questions() {
  const [byCategory, setByCategory] = useState({});
  const [activeCategoryMeta, setActiveCategoryMeta] = useState({});
  const [allCategoryMeta, setAllCategoryMeta] = useState({});
  const [stats, setStats] = useState({ total: 0, activeCount: 0, archivedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active"); // "active" | "archived" | "hidden"
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [search, setSearch] = useState("");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const [adminRes, activeRes, categoriesRes] = await Promise.all([
        api.get("/admin/questions"),
        api.get("/questions"),
        api.get("/admin/categories"),
      ]);

      setByCategory(adminRes.data.data.byCategory);

      const activeMeta = {};
      for (const cat of activeRes.data.data.categories || []) {
        activeMeta[cat.key] = {
          label: cat.label,
          icon: cat.icon,
          description: cat.description,
          color: cat.color,
        };
      }
      setActiveCategoryMeta(activeMeta);

      const allMeta = {};
      for (const cat of categoriesRes.data.data.categories || []) {
        allMeta[cat.key] = {
          label: cat.label,
          icon: cat.icon,
          description: cat.description,
          color: cat.color,
          isArchived: cat.isArchived,
        };
      }
      setAllCategoryMeta(allMeta);

      const allQuestions = adminRes.data.data.questions || [];
      const activeKeysSet = new Set(Object.keys(activeMeta));
      const trueActiveCount = allQuestions.filter(
        (q) => !q.isArchived && activeKeysSet.has(q.category)
      ).length;
      const archivedCount = adminRes.data.data.archivedCount || 0;

      setStats({
        total: adminRes.data.data.total || 0,
        activeCount: trueActiveCount,
        archivedCount,
      });

      const initialCollapsed = {};
      for (const key of Object.keys(activeMeta)) initialCollapsed[key] = true;
      for (const key of Object.keys(allMeta)) {
        if (initialCollapsed[key] === undefined) initialCollapsed[key] = true;
      }
      for (const key of Object.keys(adminRes.data.data.byCategory || {})) {
        if (initialCollapsed[key] === undefined) initialCollapsed[key] = true;
      }
      setCollapsedCategories(initialCollapsed);
    } catch (err) {
      toast.error(err.message || "Could not load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const toggleCategory = (catKey) => {
    setCollapsedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const expandAll = () => {
    const keys = [
      ...Object.keys(activeCategoryMeta),
      ...Object.keys(allCategoryMeta),
      ...Object.keys(byCategory),
    ];
    const all = {};
    for (const k of keys) all[k] = false;
    setCollapsedCategories(all);
  };

  const collapseAll = () => {
    const keys = [
      ...Object.keys(activeCategoryMeta),
      ...Object.keys(allCategoryMeta),
      ...Object.keys(byCategory),
    ];
    const all = {};
    for (const k of keys) all[k] = true;
    setCollapsedCategories(all);
  };

  const handleArchive = async (q) => {
    if (!window.confirm(
      q.isArchived
        ? "Restore this question? It will appear in new assessments."
        : "Archive this question? It will no longer appear in new assessments. Existing assessments are unaffected."
    )) return;

    setActionLoading(q._id);
    try {
      await api.patch(`/admin/questions/${q._id}`, { isArchived: !q.isArchived });
      toast.success(q.isArchived ? "Question restored." : "Question archived.");
      fetchQuestions();
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (q, direction) => {
    setActionLoading(q._id);
    try {
      await api.post(`/admin/questions/${q._id}/reorder`, { direction });
      fetchQuestions();
    } catch (err) {
      toast.error(err.message || "Reorder failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading questions..." />;

  // ---- Category buckets ----
  const activeKeys = Object.keys(activeCategoryMeta);

  const hiddenByCategoryKeys = Object.keys(allCategoryMeta).filter(
    (k) => allCategoryMeta[k]?.isArchived && (byCategory[k]?.length || 0) > 0
  );

  const orphanedKeys = Object.keys(byCategory).filter(
    (k) => !activeCategoryMeta[k] && !allCategoryMeta[k]
  );

  // Hidden by category: count only non-admin-archived questions
  const hiddenByCategoryCount = hiddenByCategoryKeys.reduce(
    (sum, k) => sum + (byCategory[k]?.filter((q) => !q.isArchived).length || 0), 0
  );

  // ---- Search ----
  const searchTerm = search.trim().toLowerCase();

  const applySearch = (catKey, qs, metaMap) => {
    if (!searchTerm) return qs;
    const meta = metaMap[catKey];
    const catLabel = (meta?.label || catKey).toLowerCase();
    const catDesc = (meta?.description || "").toLowerCase();
    if (catLabel.includes(searchTerm) || catDesc.includes(searchTerm)) return qs;
    return qs.filter(
      (q) =>
        q.text?.toLowerCase().includes(searchTerm) ||
        q.helper?.toLowerCase().includes(searchTerm) ||
        q.type?.toLowerCase().includes(searchTerm)
    );
  };

  // Active tier: non-archived questions in active categories
  const filteredActive = {};
  for (const k of activeKeys) {
    filteredActive[k] = applySearch(
      k,
      (byCategory[k] || []).filter((q) => !q.isArchived),
      activeCategoryMeta
    );
  }

  // Archived tier: admin-archived questions in active categories
  const filteredArchived = {};
  for (const k of activeKeys) {
    filteredArchived[k] = applySearch(
      k,
      (byCategory[k] || []).filter((q) => q.isArchived),
      activeCategoryMeta
    );
  }

  // Hidden tier: non-archived questions from archived categories
  const filteredHidden = {};
  for (const k of hiddenByCategoryKeys) {
    filteredHidden[k] = applySearch(
      k,
      (byCategory[k] || []).filter((q) => !q.isArchived),
      allCategoryMeta
    );
  }

  // Orphaned (active view only)
  const filteredOrphaned = {};
  for (const k of orphanedKeys) {
    filteredOrphaned[k] = applySearch(
      k,
      (byCategory[k] || []).filter((q) => !q.isArchived),
      allCategoryMeta
    );
  }

  // ---- Effective collapsed (search auto-expands) ----
  const computeEffectiveCollapsed = () => {
    if (!searchTerm) return collapsedCategories;
    const eff = {};
    const currentFiltered =
      view === "archived" ? filteredArchived
      : view === "hidden" ? filteredHidden
      : filteredActive;
    for (const k of Object.keys(currentFiltered)) {
      eff[k] = (currentFiltered[k] || []).length === 0;
    }
    return eff;
  };
  const effectiveCollapsed = computeEffectiveCollapsed();

  // ---- Search result count for current view ----
  const totalSearchResults = searchTerm
    ? view === "archived"
      ? Object.values(filteredArchived).reduce((s, a) => s + a.length, 0)
      : view === "hidden"
        ? Object.values(filteredHidden).reduce((s, a) => s + a.length, 0)
        : Object.values(filteredActive).reduce((s, a) => s + a.length, 0)
          + Object.values(filteredOrphaned).reduce((s, a) => s + a.length, 0)
    : null;

  // ---- Expand/collapse state ----
  const allKnownKeys = [...activeKeys, ...hiddenByCategoryKeys, ...orphanedKeys];
  const allExpanded = allKnownKeys.every((k) => !collapsedCategories[k]);
  const allCollapsed = allKnownKeys.every((k) => collapsedCategories[k]);

  return (
    <div className="mx-auto max-w-[1360px] p-4 md:p-8 xl:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-stone-900">
            Questions
          </h1>
          <p className="text-stone-600">
            Manage assessment questions — create, edit, reorder, archive.
          </p>
        </div>
        <button
          onClick={() => setEditingQuestion({})}
          className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          Add question
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories or questions…"
          className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-stone-200 rounded-xl shadow-sm placeholder:text-stone-400 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats / filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">

        {/* Active pill */}
        <button
          onClick={() => setView("active")}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition ${
            view === "active"
              ? "bg-emerald-100 border-emerald-400 ring-1 ring-emerald-400"
              : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-800">
            {stats.activeCount} active
          </span>
        </button>

        {/* Archived pill */}
        <button
          onClick={() => setView("archived")}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition ${
            view === "archived"
              ? "bg-stone-200 border-stone-400 ring-1 ring-stone-400"
              : "bg-stone-100 border-stone-200 hover:bg-stone-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-stone-400" />
          <span className="text-xs font-medium text-stone-700">
            {stats.archivedCount} archived
          </span>
        </button>

        {/* Hidden by category pill */}
        {hiddenByCategoryKeys.length > 0 && (
          <button
            onClick={() => setView("hidden")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition ${
              view === "hidden"
                ? "bg-amber-100 border-amber-400 ring-1 ring-amber-400"
                : "bg-amber-50 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-700">
              {hiddenByCategoryCount} hidden by category
            </span>
          </button>
        )}

        {/* Expand / collapse all */}
        {!searchTerm && (
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              disabled={allExpanded}
              className="text-xs text-stone-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition px-2 py-1 rounded hover:bg-stone-100"
            >
              Expand all
            </button>
            <span className="text-stone-300 text-xs">|</span>
            <button
              onClick={collapseAll}
              disabled={allCollapsed}
              className="text-xs text-stone-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition px-2 py-1 rounded hover:bg-stone-100"
            >
              Collapse all
            </button>
          </div>
        )}

        {searchTerm && (
          <span className="text-xs text-stone-500 animate-fade-in">
            {totalSearchResults === 0
              ? "No results"
              : `${totalSearchResults} result${totalSearchResults !== 1 ? "s" : ""} for "${search.trim()}"`}
          </span>
        )}
      </div>

      {/* ===== HIDDEN BY CATEGORY VIEW ===== */}
      {view === "hidden" && (
        <>
          {/* Info banner */}
          <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                These questions are hidden because their parent category is archived.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                To make them active again, restore the parent category first — the questions will automatically
                become available in new assessments once their category is restored.
                Go to <strong>Capability Domains</strong> to restore a category.
              </p>
            </div>
          </div>

          {hiddenByCategoryKeys.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-stone-500">No questions are currently hidden by archived categories.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenByCategoryKeys.map((catKey) => {
                const visibleQuestions = filteredHidden[catKey] || [];
                if (visibleQuestions.length === 0) return null;
                return (
                  <CategoryGroup
                    key={catKey}
                    catKey={catKey}
                    meta={allCategoryMeta[catKey]}
                    tier="hidden"
                    questions={visibleQuestions}
                    isCollapsed={!!effectiveCollapsed[catKey]}
                    onToggleCollapse={() => !searchTerm && toggleCategory(catKey)}
                    searchTerm={searchTerm}
                    onEdit={(q) => setEditingQuestion(q)}
                    onArchive={handleArchive}
                    onReorder={handleReorder}
                    actionLoading={actionLoading}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== ACTIVE / ARCHIVED VIEW ===== */}
      {view !== "hidden" && (
        <>
          {(() => {
            const filtered = view === "archived" ? filteredArchived : filteredActive;
            const visibleKeys = activeKeys.filter((k) => (filtered[k] || []).length > 0);

            if (visibleKeys.length === 0 && !searchTerm) {
              return (
                <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
                  <div className="text-4xl mb-2">{view === "archived" ? "📦" : "📝"}</div>
                  <p className="text-stone-500">
                    {view === "archived"
                      ? "No archived questions yet."
                      : "No active questions yet. Add your first one!"}
                  </p>
                </div>
              );
            }

            if (visibleKeys.length === 0 && searchTerm && totalSearchResults === 0) {
              return (
                <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center animate-fade-in">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-stone-500">
                    No questions or categories match <strong>"{search.trim()}"</strong>
                  </p>
                  <button
                    onClick={() => setSearch("")}
                    className="mt-3 text-sm text-indigo-600 hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {visibleKeys.map((catKey) => (
                  <CategoryGroup
                    key={catKey}
                    catKey={catKey}
                    meta={activeCategoryMeta[catKey]}
                    tier={view}
                    questions={filtered[catKey]}
                    isCollapsed={!!effectiveCollapsed[catKey]}
                    onToggleCollapse={() => !searchTerm && toggleCategory(catKey)}
                    searchTerm={searchTerm}
                    onEdit={(q) => setEditingQuestion(q)}
                    onArchive={handleArchive}
                    onReorder={handleReorder}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            );
          })()}

          {/* Orphaned — only in active view */}
          {view === "active" && orphanedKeys.length > 0 && (
            <div className="mt-8">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                  Orphaned
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Questions whose category record is missing entirely. This shouldn't normally happen.
                </p>
              </div>
              <div className="space-y-3">
                {orphanedKeys.map((catKey) => {
                  const visibleQuestions = filteredOrphaned[catKey] || [];
                  if (visibleQuestions.length === 0) return null;
                  return (
                    <CategoryGroup
                      key={catKey}
                      catKey={catKey}
                      meta={null}
                      tier="orphaned"
                      questions={visibleQuestions}
                      isCollapsed={!!effectiveCollapsed[catKey]}
                      onToggleCollapse={() => !searchTerm && toggleCategory(catKey)}
                      searchTerm={searchTerm}
                      onEdit={(q) => setEditingQuestion(q)}
                      onArchive={handleArchive}
                      onReorder={handleReorder}
                      actionLoading={actionLoading}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Form modal */}
      {editingQuestion !== null && (
        <QuestionFormModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => {
            setEditingQuestion(null);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}

// ---- Text highlight helper ----
function Highlight({ text, term }) {
  if (!term || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

// ---- Category group ----
// tier: "active" | "archived" | "hidden" | "orphaned"
function CategoryGroup({ catKey, meta, tier, questions, isCollapsed, onToggleCollapse, searchTerm, onEdit, onArchive, onReorder, actionLoading }) {
  const title = meta?.label || catKey.replace(/-/g, " ");
  const icon = meta?.icon;
  const description = meta?.description;
  const isHidden = tier === "hidden";
  const isOrphaned = tier === "orphaned";

  const headerBg = isHidden
    ? "bg-amber-50/60 border-amber-200"
    : isOrphaned
      ? "bg-amber-50 border-amber-300"
      : "bg-stone-50 border-stone-200";

  const containerBorder = isHidden
    ? "border-amber-200"
    : isOrphaned
      ? "border-amber-300"
      : "border-stone-200";

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${containerBorder} ${isHidden ? "opacity-90" : ""}`}>
      <button
        onClick={onToggleCollapse}
        disabled={!!searchTerm}
        className={`w-full px-6 py-4 ${headerBg} border-b text-left hover:bg-stone-100 transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset disabled:hover:bg-stone-50 disabled:cursor-default`}
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2 flex-wrap">
              {icon && <span className="text-xl leading-none">{icon}</span>}
              <span className={meta ? "" : "capitalize"}>
                <Highlight text={title} term={searchTerm} />
              </span>
              {isHidden && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  Category archived
                </span>
              )}
              {isOrphaned && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                  Orphaned
                </span>
              )}
            </h2>
            {description && !isCollapsed && (
              <p className="text-xs text-stone-500 mt-0.5 animate-fade-in">{description}</p>
            )}
            <p className="text-xs text-stone-500 mt-1">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </p>
          </div>

          <svg
            className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200 group-hover:text-stone-600 ${isCollapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!isCollapsed && (
        <ul className="divide-y divide-stone-100 animate-slide-down">
          {questions.map((q, idx) => (
            <QuestionRow
              key={q._id}
              question={q}
              tier={tier}
              isFirst={idx === 0}
              isLast={idx === questions.length - 1}
              onEdit={() => onEdit(q)}
              onArchive={() => onArchive(q)}
              onReorder={(dir) => onReorder(q, dir)}
              isLoading={actionLoading === q._id}
              searchTerm={searchTerm}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Single question row ----
function QuestionRow({ question, tier, isFirst, isLast, onEdit, onArchive, onReorder, isLoading, searchTerm }) {
  const TYPE_LABELS = {
    "likert": "Likert (1-5)",
    "frequency": "Frequency",
    "multi": "Multi-select",
  };

  const readOnly = tier === "hidden" || tier === "orphaned";
  const disabledReason = tier === "hidden"
    ? "Restore the category to manage this question"
    : tier === "orphaned"
      ? "Cannot edit — parent category is missing"
      : null;

  return (
    <li className={`px-4 py-4 transition hover:bg-stone-50 md:px-6 ${question.isArchived ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Reorder buttons */}
        <div className="hidden flex-shrink-0 flex-col gap-1 pt-1 md:flex">
          <button
            onClick={() => onReorder("up")}
            disabled={isFirst || isLoading || question.isArchived || readOnly}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Move up"
            title={readOnly ? disabledReason : "Move up"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onReorder("down")}
            disabled={isLast || isLoading || question.isArchived || readOnly}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Move down"
            title={readOnly ? disabledReason : "Move down"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                  {TYPE_LABELS[question.type] || question.type}
                </span>
                {question.isArchived && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Archived
                  </span>
                )}
                {tier === "hidden" && !question.isArchived && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Hidden by category
                  </span>
                )}
              </div>
              <p className="text-sm font-medium leading-6 text-stone-900 md:text-[15px]">
                <Highlight text={question.text} term={searchTerm} />
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={onEdit}
                disabled={isLoading || readOnly}
                className="rounded-lg p-2 text-stone-400 transition hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                aria-label="Edit"
                title={readOnly ? disabledReason : "Edit"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={onArchive}
                disabled={isLoading || readOnly}
                className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                  question.isArchived
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                }`}
                aria-label={question.isArchived ? "Restore" : "Archive"}
                title={readOnly ? disabledReason : (question.isArchived ? "Restore" : "Archive")}
              >
                {question.isArchived ? (
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

          {question.helper && (
            <p className="mt-1 text-xs italic text-stone-500 md:text-sm">
              <Highlight text={question.helper} term={searchTerm} />
            </p>
          )}
          {question.options && question.options.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {question.options.map((opt) => (
                <span key={opt.value || opt} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                  {opt.label || opt}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 md:hidden">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Reorder
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onReorder("up")}
                disabled={isFirst || isLoading || question.isArchived || readOnly}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move up"
                title={readOnly ? disabledReason : "Move up"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                Up
              </button>
              <button
                onClick={() => onReorder("down")}
                disabled={isLast || isLoading || question.isArchived || readOnly}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move down"
                title={readOnly ? disabledReason : "Move down"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Down
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export default Questions;
