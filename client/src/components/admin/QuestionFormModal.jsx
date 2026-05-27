import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";

const TYPES = [
  { value: "likert", label: "Likert (1-5 agreement scale)" },
  { value: "frequency", label: "Frequency (never to always)" },
  { value: "multi", label: "Multi-select (custom options)" },
];

function QuestionFormModal({ question, onClose, onSaved }) {
  const isNew = !question?._id;

  const [formData, setFormData] = useState({
    category: question?.category || "",
    type: question?.type || "likert",
    text: question?.text || "",
    helper: question?.helper || "",
    options: question?.options || [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const typeMenuRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(false);
      try {
        const res = await api.get("/admin/categories");
        const cats = (res.data.data.categories || [])
          .filter((c) => !c.isArchived)
          .map((c) => ({ key: c.key, label: c.label, icon: c.icon }));
        setCategoryOptions(cats);

        if (isNew && cats.length > 0) {
          setFormData((prev) => (prev.category ? prev : { ...prev, category: cats[0].key }));
        }
      } catch {
        setCategoriesError(true);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, [isNew]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && categoryMenuOpen) {
        setCategoryMenuOpen(false);
        return;
      }
      if (e.key === "Escape" && typeMenuOpen) {
        setTypeMenuOpen(false);
        return;
      }
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [categoryMenuOpen, onClose, submitting, typeMenuOpen]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const handlePointerDown = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [categoryMenuOpen]);

  useEffect(() => {
    if (!typeMenuOpen) return;
    const handlePointerDown = (event) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target)) {
        setTypeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [typeMenuOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCategory = categoryOptions.find((cat) => cat.key === formData.category);
  const selectedType = TYPES.find((type) => type.value === formData.type);

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { value: "", label: "" }],
    }));
  };

  const updateOption = (idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt)),
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

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      category: formData.category,
      type: formData.type,
      text: formData.text.trim(),
      helper: formData.helper.trim(),
    };

    if (formData.type === "multi") {
      const trimmedOptions = formData.options
        .map((option) => ({
          value: option.value.trim(),
          label: option.label.trim(),
        }))
        .filter((option) => option.value && option.label);

      if (trimmedOptions.length === 0) {
        toast.error("Multi-select questions need at least one option");
        return;
      }

      const duplicateValue = trimmedOptions.find(
        (option, index) => trimmedOptions.findIndex((item) => item.value === option.value) !== index
      );
      if (duplicateValue) {
        toast.error("Option values must be unique");
        return;
      }

      payload.options = trimmedOptions;
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
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl animate-dropdown"
          role="dialog"
          aria-modal="true"
          aria-labelledby="question-modal-title"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
            <h2 id="question-modal-title" className="text-lg font-semibold text-stone-900">
              {isNew ? "New question" : "Edit question"}
            </h2>
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-md p-1.5 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Close"
            >
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Category
              </label>
              {isNew && !categoriesLoading && !categoriesError && categoryOptions.length > 0 ? (
                <div className="relative" ref={categoryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-left text-sm shadow-sm transition hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    aria-haspopup="listbox"
                    aria-expanded={categoryMenuOpen}
                  >
                    <span className="min-w-0 truncate text-stone-900">
                      {selectedCategory ? (
                        <>
                          {selectedCategory.icon ? `${selectedCategory.icon} ` : ""}
                          {selectedCategory.label}
                        </>
                      ) : "Select a category"}
                    </span>
                    <svg className={`h-4 w-4 flex-shrink-0 text-stone-400 transition ${categoryMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {categoryMenuOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
                      <div className="max-h-64 overflow-y-auto py-1">
                        {categoryOptions.map((cat) => {
                          const active = cat.key === formData.category;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => {
                                handleChange("category", cat.key);
                                setCategoryMenuOpen(false);
                              }}
                              className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition ${
                                active ? "bg-indigo-50 text-indigo-700" : "text-stone-700 hover:bg-stone-50"
                              }`}
                            >
                              <span className="mt-0.5 flex-shrink-0">{cat.icon || "•"}</span>
                              <span className="min-w-0 leading-snug">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  disabled={!isNew || categoriesLoading || categoriesError}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-50"
                >
                  {categoriesLoading && <option value="">Loading categories...</option>}
                  {categoriesError && <option value="">Could not load categories</option>}
                  {!categoriesLoading && !categoriesError && categoryOptions.length === 0 && <option value="">No active categories</option>}
                  {!categoriesLoading && !categoriesError && categoryOptions.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.icon ? `${cat.icon} ${cat.label}` : cat.label}
                    </option>
                  ))}
                  {!isNew && formData.category && !categoryOptions.find((c) => c.key === formData.category) && (
                    <option value={formData.category}>{formData.category} (archived)</option>
                  )}
                </select>
              )}
              {!isNew && <p className="mt-1 text-sm text-stone-500">Category cannot be changed after creation.</p>}
              {categoriesError && <p className="mt-1 text-sm text-red-600">Failed to load categories. Refresh the page.</p>}
              {!categoriesLoading && !categoriesError && categoryOptions.length === 0 && (
                <p className="mt-1 text-sm text-amber-700">No active categories. Create one in Categories first.</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Question type
              </label>
              {isNew ? (
                <div className="relative" ref={typeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setTypeMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-left text-sm shadow-sm transition hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    aria-haspopup="listbox"
                    aria-expanded={typeMenuOpen}
                  >
                    <span className="min-w-0 truncate text-stone-900">
                      {selectedType?.label || "Select a question type"}
                    </span>
                    <svg className={`h-4 w-4 flex-shrink-0 text-stone-400 transition ${typeMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {typeMenuOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
                      <div className="max-h-56 overflow-y-auto py-1">
                        {TYPES.map((type) => {
                          const active = type.value === formData.type;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                handleChange("type", type.value);
                                setTypeMenuOpen(false);
                              }}
                              className={`block w-full px-3 py-2.5 text-left text-sm transition ${
                                active ? "bg-indigo-50 text-indigo-700" : "text-stone-700 hover:bg-stone-50"
                              }`}
                            >
                              <span className="block leading-snug">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <select
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  disabled
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-50"
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
              {!isNew && <p className="mt-1 text-sm text-stone-500">Type cannot be changed after creation.</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Question text *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => handleChange("text", e.target.value)}
                rows={3}
                placeholder="e.g., How confident do you feel administering medications?"
                className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Help text (optional)
              </label>
              <input
                type="text"
                value={formData.helper}
                onChange={(e) => handleChange("helper", e.target.value)}
                placeholder="e.g., Think about routine medications, not just emergencies"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {formData.type === "multi" && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-stone-700">Options</label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    + Add option
                  </button>
                </div>

                {formData.options.length === 0 ? (
                  <p className="text-sm italic text-stone-500">No options yet. Click "Add option" to start.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => updateOption(idx, "value", e.target.value)}
                          placeholder="value (e.g., bathing)"
                          className="flex-1 rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateOption(idx, "label", e.target.value)}
                          placeholder="label (e.g., Bathing)"
                          className="flex-1 rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="rounded p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm text-stone-600 transition hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
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
