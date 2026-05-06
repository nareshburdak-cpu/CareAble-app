// client/src/components/admin/CategoryFormModal.jsx

/**
 * CategoryFormModal
 * -----------------
 * Modal for creating or editing a capability domain.
 *
 * Pass `category` prop:
 *   - {} (empty object) = new category
 *   - { ...existing }   = edit existing (key field locked if in-use)
 *
 * Props:
 *   - category        — the category object to edit, or {} for new
 *   - allowedColors   — array of colour names from /admin/categories response
 *   - onClose         — called when modal closes
 *   - onSaved         — called on successful save
 */

import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";

// Slugify a label into a kebab-case key. Mirrors server-side slugify
// in categoryController.js — keep them in sync if you change one.
function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function CategoryFormModal({ category, allowedColors = [], onClose, onSaved }) {
  const isNew = !category?._id;

  // Key is locked if the category has any questions (active or archived).
  // This mirrors the server-side checkKeyInUse, but we compute it here
  // for immediate UI feedback. Server enforces it authoritatively.
  const keyLocked = !isNew && (
    (category?.questionCount || 0) > 0 ||
    (category?.archivedQuestionCount || 0) > 0
  );

  const [formData, setFormData] = useState({
    label: category?.label || "",
    key: category?.key || "",
    description: category?.description || "",
    icon: category?.icon || "",
    color: category?.color || "indigo",
  });

  // Track whether the user has manually edited the key field. If they
  // haven't, we auto-slug from the label as they type.
  const [keyTouched, setKeyTouched] = useState(!isNew);

  const [submitting, setSubmitting] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-derive key from label as admin types — only on new categories,
      // and only until they manually edit the key field.
      if (field === "label" && isNew && !keyTouched) {
        next.key = slugify(value);
      }
      return next;
    });
  };

  const handleKeyChange = (value) => {
    setKeyTouched(true);
    setFormData((prev) => ({ ...prev, key: value.toLowerCase() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!formData.key.trim()) {
      toast.error("Key is required (auto-derived from label if you leave the label field)");
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(formData.key)) {
      toast.error("Key must be kebab-case: lowercase letters, digits, hyphens, no leading/trailing hyphens.");
      return;
    }

    // Build payload — don't mutate state
    const payload = {
      label: formData.label.trim(),
      description: formData.description.trim(),
      icon: formData.icon.trim(),
      color: formData.color,
    };
    // Only include `key` if it's new OR changed AND not locked
    if (isNew) {
      payload.key = formData.key.trim();
    } else if (formData.key !== category.key && !keyLocked) {
      payload.key = formData.key.trim();
    }

    setSubmitting(true);
    try {
      if (isNew) {
        await api.post("/admin/categories", payload);
        toast.success("Category created.");
      } else {
        await api.patch(`/admin/categories/${category._id}`, payload);
        toast.success("Category updated.");
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
              {isNew ? "New domain" : "Edit domain"}
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
            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleChange("label", e.target.value)}
                placeholder="e.g., Communication & Relational Care"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                maxLength={100}
              />
            </div>

            {/* Key */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Key *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={keyLocked}
                placeholder="auto-generated"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed"
                maxLength={80}
              />
              {keyLocked ? (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0h-2m9-9V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m12-9h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
                  </svg>
                  Key is locked — this domain has questions referencing it.
                </p>
              ) : (
                <p className="text-xs text-stone-500 mt-1">
                  Kebab-case identifier used in code. {isNew && "Auto-derived from label until you edit it."}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={2}
                placeholder="One-sentence summary shown to carers and on the results page"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                maxLength={300}
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange("icon", e.target.value)}
                placeholder="🧭"
                className="w-24 px-3 py-2 border border-stone-200 rounded-lg text-2xl text-center focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                maxLength={8}
              />
              <p className="text-xs text-stone-500 mt-1">
                Single emoji. Paste from your OS emoji picker (Win+. on Windows).
              </p>
            </div>

            {/* Colour */}
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Colour
              </label>
              <div className="flex flex-wrap gap-2">
                {(allowedColors.length > 0 ? allowedColors : [formData.color]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleChange("color", c)}
                    className={`group relative w-10 h-10 rounded-lg transition ${
                      colorClass(c)
                    } ${
                      formData.color === c
                        ? "ring-2 ring-offset-2 ring-stone-900 scale-110"
                        : "hover:scale-105"
                    }`}
                    aria-label={c}
                    title={c}
                  >
                    {formData.color === c && (
                      <svg
                        className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-1">Selected: <span className="font-mono">{formData.color}</span></p>
            </div>

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
                {submitting ? "Saving..." : isNew ? "Create domain" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// Map a colour name to a Tailwind background class for the swatch grid.
// Tailwind can't generate class names from variables, so we hard-list them.
// Must match the keys in client/src/utils/categoryColors.js.
function colorClass(name) {
  const map = {
    indigo: "bg-indigo-500",
    pink: "bg-pink-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    teal: "bg-teal-500",
    green: "bg-green-500",
    sky: "bg-sky-500",
    rose: "bg-rose-500",
    red: "bg-red-500",
    violet: "bg-violet-500",
    fuchsia: "bg-fuchsia-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    emerald: "bg-emerald-500",
  };
  return map[name] || "bg-stone-300";
}

export default CategoryFormModal;