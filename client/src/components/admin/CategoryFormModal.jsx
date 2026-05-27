import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";

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
  const [keyTouched, setKeyTouched] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, submitting]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
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
      toast.error("Key is required");
      return;
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(formData.key.trim())) {
      toast.error("Key must use lowercase kebab-case.");
      return;
    }

    const payload = {
      label: formData.label.trim(),
      description: formData.description.trim(),
      icon: formData.icon.trim(),
      color: formData.color,
    };

    if (isNew) {
      payload.key = formData.key.trim();
    } else if (formData.key.trim() !== category.key && !keyLocked) {
      payload.key = formData.key.trim();
    }

    setSubmitting(true);
    try {
      if (isNew) {
        await api.post("/admin/categories", payload);
        toast.success("Domain created.");
      } else {
        await api.patch(`/admin/categories/${category._id}`, payload);
        toast.success("Domain updated.");
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
          aria-labelledby="category-modal-title"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
            <h2 id="category-modal-title" className="text-lg font-semibold text-stone-900">
              {isNew ? "New domain" : "Edit domain"}
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
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleChange("label", e.target.value)}
                placeholder="e.g., Communication and relational care"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Key *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={keyLocked}
                placeholder="auto-generated"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500"
                maxLength={80}
              />
              {keyLocked ? (
                <p className="mt-1 text-sm text-amber-700">
                  Key is locked because this domain already has linked questions.
                </p>
              ) : (
                <p className="mt-1 text-sm text-stone-500">
                  Kebab-case identifier used in code. {isNew ? "It auto-fills from the label until you edit it." : ""}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={2}
                placeholder="One-sentence summary shown in the product"
                className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                maxLength={300}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange("icon", e.target.value)}
                placeholder="🧭"
                className="w-28 rounded-2xl border border-stone-200 px-3 py-3 text-center text-3xl leading-none focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                maxLength={8}
              />
              <p className="mt-1 text-sm text-stone-500">
                Single emoji. Paste from your OS emoji picker (Win+. on Windows).
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                Colour
              </label>
              <div className="flex flex-wrap gap-2">
                {(allowedColors.length > 0 ? allowedColors : [formData.color]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleChange("color", c)}
                    className={`relative h-10 w-10 rounded-lg transition ${colorClass(c)} ${
                      formData.color === c
                        ? "scale-110 ring-2 ring-stone-900 ring-offset-2"
                        : "hover:scale-105"
                    }`}
                    aria-label={c}
                    title={c}
                  >
                    {formData.color === c && (
                      <svg
                        className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow"
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
              <p className="mt-1 text-sm text-stone-500">
                Selected: <span className="font-mono">{formData.color}</span>
              </p>
            </div>

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
                {submitting ? "Saving..." : isNew ? "Create domain" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

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
