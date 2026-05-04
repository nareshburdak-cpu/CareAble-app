/**
 * Admin: Question Management
 * --------------------------
 * List, edit, archive, reorder questions across all categories.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import QuestionFormModal from "../../components/admin/QuestionFormModal";

function Questions() {
  const [byCategory, setByCategory] = useState({});
  const [stats, setStats] = useState({ total: 0, activeCount: 0, archivedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);  // null | {} (new) | question object
  const [actionLoading, setActionLoading] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/questions");
      setByCategory(res.data.data.byCategory);
      setStats({
        total: res.data.data.total,
        activeCount: res.data.data.activeCount,
        archivedCount: res.data.data.archivedCount,
      });
    } catch (err) {
      toast.error(err.message || "Could not load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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

  const categoryKeys = Object.keys(byCategory);

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
            Questions
          </h1>
          <p className="text-stone-600">
            Manage assessment questions — create, edit, reorder, archive.
          </p>
        </div>
        <button
          onClick={() => setEditingQuestion({})}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
        >
          + Add question
        </button>
      </div>

      {/* Stats + Filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-800">
            {stats.activeCount} active
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-stone-400" />
          <span className="text-xs font-medium text-stone-700">
            {stats.archivedCount} archived
          </span>
        </div>
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded text-indigo-600"
          />
          <span className="text-sm text-stone-600">Show archived</span>
        </label>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categoryKeys.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-stone-500">No questions yet. Add your first one!</p>
          </div>
        ) : (
          categoryKeys.map((catKey) => {
            const allQuestions = byCategory[catKey];
            const visibleQuestions = showArchived
              ? allQuestions
              : allQuestions.filter((q) => !q.isArchived);

            if (visibleQuestions.length === 0) return null;

            return (
              <CategoryGroup
                key={catKey}
                catKey={catKey}
                questions={visibleQuestions}
                onEdit={(q) => setEditingQuestion(q)}
                onArchive={handleArchive}
                onReorder={handleReorder}
                actionLoading={actionLoading}
              />
            );
          })
        )}
      </div>

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

// ---- Category group (with questions) ----
function CategoryGroup({ catKey, questions, onEdit, onArchive, onReorder, actionLoading }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
        <h2 className="font-semibold text-stone-900 capitalize">
          {catKey.replace(/-/g, " ")}
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ul className="divide-y divide-stone-100">
        {questions.map((q, idx) => (
          <QuestionRow
            key={q._id}
            question={q}
            isFirst={idx === 0}
            isLast={idx === questions.length - 1}
            onEdit={() => onEdit(q)}
            onArchive={() => onArchive(q)}
            onReorder={(dir) => onReorder(q, dir)}
            isLoading={actionLoading === q._id}
          />
        ))}
      </ul>
    </div>
  );
}

// ---- Single question row ----
function QuestionRow({ question, isFirst, isLast, onEdit, onArchive, onReorder, isLoading }) {
  const TYPE_LABELS = {
    "likert": "Likert (1-5)",
    "frequency": "Frequency",
    "multi": "Multi-select",
  };

  return (
    <li className={`px-6 py-4 hover:bg-stone-50 transition ${question.isArchived ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1 flex-shrink-0 pt-1">
          <button
            onClick={() => onReorder("up")}
            disabled={isFirst || isLoading || question.isArchived}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Move up"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onReorder("down")}
            disabled={isLast || isLoading || question.isArchived}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Move down"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
              {TYPE_LABELS[question.type] || question.type}
            </span>
            {question.isArchived && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                Archived
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-stone-900">{question.text}</p>
          {question.helpText && (
            <p className="text-xs text-stone-500 mt-1 italic">{question.helpText}</p>
          )}
          {question.options && question.options.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {question.options.map((opt) => (
                <span key={opt.value || opt} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                  {opt.label || opt}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            aria-label="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onArchive}
            disabled={isLoading}
            className={`p-2 rounded transition ${
              question.isArchived
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-stone-400 hover:text-amber-600 hover:bg-amber-50"
            }`}
            aria-label={question.isArchived ? "Restore" : "Archive"}
            title={question.isArchived ? "Restore" : "Archive"}
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
    </li>
  );
}

export default Questions;