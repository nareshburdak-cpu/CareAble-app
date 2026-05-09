// client/src/pages/admin/Settings.jsx

/**
 * Admin Settings Page
 * -------------------
 * Allows admins to control platform-wide settings.
 *
 * Uses GET /api/admin/settings/meta to get both settings values
 * and the computed maxAllowed (min question pool across active categories).
 * This ensures the stepper never lets admin set a number higher than
 * what any single category can supply.
 *
 * Stale setting detection: if saved value > maxAllowed (questions were
 * archived after the setting was saved), shows a warning and pre-clamps
 * the local value so admin can save the corrected number immediately.
 */

import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";

function Settings() {
  const [settings, setSettings] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/settings/meta");
        setSettings(res.data.data.settings);
        setMeta(res.data.data.meta);
      } catch (err) {
        toast.error(err.message || "Could not load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdate = async (key, value) => {
    setSaving(key);
    try {
      const res = await api.patch(`/admin/settings/${key}`, { value });
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value: res.data.data.value } : s))
      );
      toast.success("Setting saved. Applies to new assessments going forward.");
    } catch (err) {
      toast.error(err.message || "Could not save setting");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
          Settings
        </h1>
        <p className="text-stone-500">
          Platform-wide configuration. Changes apply to new assessments only —
          submitted assessments are never affected.
        </p>
      </div>

      {/* Pool info banner */}
      {meta && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-indigo-800">
              {meta.activeCategories} active domains · smallest pool has {meta.maxAllowed} question{meta.maxAllowed === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Maximum selectable value is capped at {meta.maxAllowed} to ensure every domain
              contributes equally. Add more questions to a domain to raise this limit.
            </p>
          </div>
        </div>
      )}

      {/* Settings cards */}
      <div className="space-y-4">
        {settings.map((setting) => (
          <SettingCard
            key={setting.key}
            setting={setting}
            maxAllowed={meta?.maxAllowed ?? 10}
            activeCategories={meta?.activeCategories ?? 12}
            isSaving={saving === setting.key}
            onSave={handleUpdate}
          />
        ))}

        {settings.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
            <p className="text-stone-400 text-sm">No settings available.</p>
          </div>
        )}
      </div>

      {/* Safety note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800">Changes are non-destructive</p>
          <p className="text-xs text-amber-700 mt-0.5">
            All submitted assessments and certificates remain valid. The new setting
            only affects assessments started after the change is saved.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Setting card ───────────────────────────────────────────────────
function SettingCard({ setting, maxAllowed, activeCategories, isSaving, onSave }) {
  // Clamp local value to maxAllowed in case questions were archived
  // since the setting was last saved
  const [localValue, setLocalValue] = useState(
    Math.min(setting.value, maxAllowed)
  );

  const isDirty  = localValue !== setting.value;
  const isStale  = setting.value > maxAllowed;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(setting.key, localValue);
  };

  const handleReset = () => setLocalValue(setting.value);

  const LABELS = {
    questionsPerCategory: "Questions per Capability Domain",
  };

  const label          = LABELS[setting.key] || setting.key;
  const totalQuestions = localValue * activeCategories;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-stone-900">{label}</h3>
          <p className="text-sm text-stone-500 mt-0.5">{setting.description}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-mono px-2 py-1 bg-stone-100 text-stone-500 rounded-md">
          {setting.key}
        </span>
      </div>

      {/* Card body */}
      <div className="px-6 py-5">

        {/* Stale setting warning */}
        {isStale && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 flex gap-2.5">
            <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-rose-700">
                Setting exceeds available questions
              </p>
              <p className="text-xs text-rose-600 mt-0.5">
                The saved value ({setting.value}) is higher than the smallest category pool ({maxAllowed}).
                Questions were likely archived after this was set.
                New assessments are already capped at {maxAllowed} per domain — save the corrected value below to keep things consistent.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <NumberInput
              value={localValue}
              onChange={setLocalValue}
              min={1}
              max={maxAllowed}
              defaultValue={setting.default}
            />
          </div>

          <div className="flex items-center gap-2 pb-7">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                Reset
              </button>
            )}
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isDirty && !isSaving
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : "Save"}
            </button>
          </div>
        </form>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-4 text-xs text-stone-400 flex-wrap">
          <span>
            Current:{" "}
            <span className={`font-semibold ${isStale ? "text-rose-600" : "text-stone-600"}`}>
              {setting.value}{isStale && " ⚠️"}
            </span>
          </span>
          <span>·</span>
          <span>
            Default:{" "}
            <span className="font-semibold text-stone-500">{setting.default}</span>
          </span>
          <span>·</span>
          <span>
            Max available:{" "}
            <span className="font-semibold text-stone-500">{maxAllowed}</span>
          </span>
          <span>·</span>
          <span>
            Total questions:{" "}
            <span className="font-semibold text-indigo-600">
              {totalQuestions} across {activeCategories} domains
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Number input with stepper + visual scale ───────────────────────
function NumberInput({ value, onChange, min, max, defaultValue }) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">
        Questions per domain
      </label>
      <div className="flex items-center gap-3 flex-wrap">

        {/* Stepper */}
        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden flex-shrink-0">
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-r border-stone-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <div className="w-14 text-center">
            <span className="text-xl font-bold text-stone-900">{value}</span>
          </div>
          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-l border-stone-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Visual scale — only renders up to max */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-1">
            {Array.from({ length: max }).map((_, i) => {
              const isSelected = i + 1 <= value;
              const isDefault  = i + 1 === defaultValue;
              const isCurrent  = i + 1 === value;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange(i + 1)}
                  title={isDefault ? `${i + 1} (default)` : `${i + 1}`}
                  className={`flex-1 h-8 rounded transition-all text-xs font-semibold ${
                    isCurrent
                      ? "bg-indigo-600 text-white scale-105 shadow-sm"
                      : isSelected
                      ? "bg-indigo-200 text-indigo-800 hover:bg-indigo-300"
                      : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                  }`}
                >
                  {i + 1}
                  {isDefault && !isCurrent && (
                    <span className="block text-[8px] leading-none opacity-60">dflt</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[10px] text-stone-400">Shorter</span>
            <span className="text-[10px] text-stone-400">Longer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;