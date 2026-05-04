/**
 * QuestionFormModal
 * -----------------
 * Modal for creating or editing a question.
 *
 * Pass `question` prop:
 *   - {} (empty object) = new question
 *   - { ...existing } = edit existing
 */

import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";

const TYPES = [
  { value: "likert", label: "Likert (1-5 agreement scale)" },
  { value: "frequency", label: "Frequency (never → always)" },
  { value: "multi", label: "Multi-select (custom options)" },
];

function QuestionFormModal({ question, onClose, onSaved }) {
  const isNew = !question?._id;

  const [formData, setFormData] = useState({
    category: question?.category || "personal-care",
    type: question?.type || "likert",
    text: question?.text || "",
    helpText: question?.helpText || "",
    options: question?.options || [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);

  // Fetch the available categories from the backend (use existing /questions endpoint)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/admin/questions");
        const cats = Object.keys(res.data.data.byCategory || {});
        setCategoryOptions(cats);
      } catch {
        // fallback to defaults
        setCategoryOptions([
          "personal-care",
          "health-support",
          "emotional-care",
          "household",
          "advocacy",
          "self-care",
        ]);
      }
    };
    loadCategories();
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { value: "", label: "" }],
    }));
  };

  const updateOption = (idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === idx ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const removeOption = (idx) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.text.trim()) {
        toast.error("Question text is required");
        return;
    }

    // Build the payload — don't mutate formData
    const payload = { ...formData };

    if (formData.type === "multi") {
        const validOptions = formData.options.filter((o) => o.value && o.label);
        if (validOptions.length === 0) {
        toast.error("Multi-select questions need at least one option");
        return;
        }
        payload.options = validOptions;
    } else {
        // Non-multi-select: don't send options at all
        delete payload.options;
    }

    setSubmitting(true);
    try {
        if (isNew) {
        await api.post("/admin/questions", payload);
        toast.success("Question created.");
        } else {
        await api.patch(`/admin/questions/${question._id}`, payload);
        toast.success("Question updated.");
        }
        onSaved?.();
    } catch (err) {
        toast.error(err.message || "Save failed");
    } finally {
        setSubmitting(false);
    }
    };
  return (
    <>
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-dropdown">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white">
            <h2 className="font-semibold text-stone-900">
              {isNew ? "New question" : "Edit question"}
            </h2>
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={!isNew}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-50"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
              {!isNew && (
                <p className="text-xs text-stone-500 mt-1">Category cannot be changed after creation.</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Question type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                disabled={!isNew}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-50"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {!isNew && (
                <p className="text-xs text-stone-500 mt-1">Type cannot be changed after creation.</p>
              )}
            </div>

            {/* Text */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Question text *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => handleChange("text", e.target.value)}
                rows={3}
                placeholder="e.g., How confident do you feel administering medications?"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Help text */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Help text (optional)
              </label>
              <input
                type="text"
                value={formData.helpText}
                onChange={(e) => handleChange("helpText", e.target.value)}
                placeholder="e.g., Think about routine medications, not just emergencies"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Options (only for multi-select) */}
            {formData.type === "multi" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-stone-700 uppercase tracking-wider">
                    Options
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    + Add option
                  </button>
                </div>

                {formData.options.length === 0 ? (
                  <p className="text-sm text-stone-500 italic">No options yet. Click "Add option" to start.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) => updateOption(idx, "value", e.target.value)}
                          placeholder="value (e.g., bathing)"
                          className="flex-1 px-2 py-1.5 border border-stone-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateOption(idx, "label", e.target.value)}
                          placeholder="label (e.g., Bathing)"
                          className="flex-1 px-2 py-1.5 border border-stone-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          aria-label="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition"
              >
                {submitting ? "Saving..." : isNew ? "Create question" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default QuestionFormModal;