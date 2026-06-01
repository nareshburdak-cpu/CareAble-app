// client/src/pages/admin/Settings.jsx

/**
 * Admin Settings Page
 * -------------------
 * questionsPerCategory  — NumberInput stepper (1–10)
 * assessmentCooldownHours — TimeInput (1–720 hours, shows days/hours breakdown)
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
      toast.success(
        key === "inProgressAssessmentExpiryDays"
          ? "Setting saved. In-progress expiry times refreshed."
          : "Setting saved. Applies to new assessments going forward."
      );
    } catch (err) {
      toast.error(err.message || "Could not save setting");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 p-4 md:p-8 xl:p-10">
      {/* Header */}
      <div>
        <h1 className="mb-2 font-serif text-2xl font-bold text-stone-900 md:text-3xl">
          Settings
        </h1>
        <p className="text-stone-500">
          Platform-wide configuration. Changes apply to new assessments only —
          submitted assessments are never affected.
        </p>
      </div>

      {/* Pool info banner */}
      {meta && (
        <div className="flex gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-indigo-800">
              {meta.activeCategories} active domains · smallest pool has {meta.maxAllowed} question{meta.maxAllowed === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Maximum selectable value for questions per domain is capped at {meta.maxAllowed}.
              Add more questions to a domain to raise this limit.
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
      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
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
  const [localValue, setLocalValue] = useState(
    setting.key === "questionsPerCategory"
      ? Math.min(setting.value, maxAllowed)
      : setting.value
  );

  const isDirty = localValue !== setting.value;
  const isStale = setting.key === "questionsPerCategory" && setting.value > maxAllowed;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(setting.key, localValue);
  };

  const handleReset = () => setLocalValue(setting.value);

  const LABELS = {
    questionsPerCategory:    "Questions per Capability Domain",
    assessmentCooldownHours: "Assessment Retake Cooldown",
    inProgressAssessmentExpiryDays: "In-progress Assessment Expiry",
  };

  const label          = LABELS[setting.key] || setting.key;
  const totalQuestions = setting.key === "questionsPerCategory"
    ? localValue * activeCategories
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-4 py-4 md:px-6">
        <div>
          <h3 className="font-semibold text-stone-900">{label}</h3>
          <p className="text-sm text-stone-500 mt-0.5">{setting.description}</p>
        </div>
        <span className="flex-shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-mono text-stone-500">
          {setting.key}
        </span>
      </div>

      {/* Card body */}
      <div className="px-4 py-5 md:px-6">

        {isStale && (
          <div className="mb-4 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-rose-700">Setting exceeds available questions</p>
              <p className="text-xs text-rose-600 mt-0.5">
                The saved value ({setting.value}) is higher than the smallest category pool ({maxAllowed}).
                Questions were likely archived after this was set. Save the corrected value below.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            {setting.key === "questionsPerCategory" ? (
              <NumberInput
                value={localValue}
                onChange={setLocalValue}
                min={1}
                max={maxAllowed}
                defaultValue={setting.default}
              />
            ) : setting.key === "inProgressAssessmentExpiryDays" ? (
              <DaysInput
                value={localValue}
                onChange={setLocalValue}
                defaultValue={setting.default}
              />
            ) : (
              <TimeInput
                value={localValue}
                onChange={setLocalValue}
                defaultValue={setting.default}
              />
            )}
          </div>

          <div className="flex items-center gap-2 pb-0 md:pb-7">
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
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-400">
          <span>
            Current:{" "}
            <span className={`font-semibold ${isStale ? "text-rose-600" : "text-stone-600"}`}>
              {setting.value}{isStale && " ⚠️"}
            </span>
          </span>
          <span>·</span>
          <span>Default: <span className="font-semibold text-stone-500">{setting.default}</span></span>
          {totalQuestions !== null && (
            <>
              <span>·</span>
              <span>
                Total questions:{" "}
                <span className="font-semibold text-indigo-600">
                  {totalQuestions} across {activeCategories} domains
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NumberInput — for questionsPerCategory ─────────────────────────
function NumberInput({ value, onChange, min, max, defaultValue }) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">
        Questions per domain
      </label>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-shrink-0 items-center overflow-hidden rounded-lg border border-stone-200">
          <button type="button" onClick={decrement} disabled={value <= min}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-r border-stone-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <div className="w-14 text-center">
            <span className="text-xl font-bold text-stone-900">{value}</span>
          </div>
          <button type="button" onClick={increment} disabled={value >= max}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-l border-stone-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            {Array.from({ length: max }).map((_, i) => {
              const isSelected = i + 1 <= value;
              const isDefault  = i + 1 === defaultValue;
              const isCurrent  = i + 1 === value;
              return (
                <button key={i} type="button" onClick={() => onChange(i + 1)}
                  title={isDefault ? `${i + 1} (default)` : `${i + 1}`}
                  className={`flex-1 h-8 rounded transition-all text-xs font-semibold ${
                    isCurrent ? "bg-indigo-600 text-white scale-105 shadow-sm"
                    : isSelected ? "bg-indigo-200 text-indigo-800 hover:bg-indigo-300"
                    : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                  }`}>
                  {i + 1}
                  {isDefault && !isCurrent && (
                    <span className="block text-xs leading-none opacity-60">dflt</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-xs text-stone-400">Shorter</span>
            <span className="text-xs text-stone-400">Longer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TimeInput — for assessmentCooldownHours ────────────────────────
function DaysInput({ value, onChange, defaultValue }) {
  const MIN = 1;
  const MAX = 90;
  const PRESETS = [
    { label: "1 day", days: 1 },
    { label: "3 days", days: 3 },
    { label: "7 days", days: 7 },
    { label: "14 days", days: 14 },
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
  ];

  const handleInput = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(MIN, Math.min(MAX, parsed)));
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">
        Expiry window
      </label>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => onChange(p.days)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
              value === p.days
                ? "bg-indigo-600 text-white border-indigo-600"
                : p.days === defaultValue
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
            }`}
          >
            {p.label}
            {p.days === defaultValue && value !== p.days && (
              <span className="ml-1 opacity-60 text-xs">(default)</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center overflow-hidden rounded-lg border border-stone-200">
          <button type="button"
            onClick={() => onChange(Math.max(MIN, value - 1))}
            disabled={value <= MIN}
            className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-r border-stone-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min={MIN}
            max={MAX}
            value={value}
            onChange={handleInput}
            className="w-16 text-center text-xl font-bold text-stone-900 border-none outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pr-3 text-xs text-stone-400 font-medium">days</span>
          <button type="button"
            onClick={() => onChange(Math.min(MAX, value + 1))}
            disabled={value >= MAX}
            className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-l border-stone-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <span className="text-sm font-semibold text-indigo-700">
          In-progress drafts expire after {value} day{value === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mt-2 text-xs text-stone-400">Enter any value between 1 and 90 days.</p>
    </div>
  );
}

function TimeInput({ value, onChange, defaultValue }) {
  const MIN = 1;
  const MAX = 720;

  // Preset options shown as quick-select pills
  const PRESETS = [
    { label: "1 hr",   hours: 1   },
    { label: "6 hrs",  hours: 6   },
    { label: "12 hrs", hours: 12  },
    { label: "1 day",  hours: 24  },
    { label: "3 days", hours: 72  },
    { label: "7 days", hours: 168 },
    { label: "30 days",hours: 720 },
  ];

  const handleInput = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(MIN, Math.min(MAX, parsed)));
    }
  };

  // Human-readable breakdown
  const days  = Math.floor(value / 24);
  const hours = value % 24;
  const breakdown = [
    days  > 0 ? `${days} day${days === 1 ? "" : "s"}` : "",
    hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(" ") || "0 hours";

  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">
        Cooldown duration
      </label>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.hours}
            type="button"
            onClick={() => onChange(p.hours)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
              value === p.hours
                ? "bg-indigo-600 text-white border-indigo-600"
                : p.hours === defaultValue
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
            }`}
          >
            {p.label}
            {p.hours === defaultValue && value !== p.hours && (
              <span className="ml-1 opacity-60 text-xs">(default)</span>
            )}
          </button>
        ))}
      </div>

      {/* Manual input */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center overflow-hidden rounded-lg border border-stone-200">
          <button type="button"
            onClick={() => onChange(Math.max(MIN, value - 1))}
            disabled={value <= MIN}
            className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-r border-stone-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min={MIN}
            max={MAX}
            value={value}
            onChange={handleInput}
            className="w-16 text-center text-xl font-bold text-stone-900 border-none outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pr-3 text-xs text-stone-400 font-medium">hrs</span>
          <button type="button"
            onClick={() => onChange(Math.min(MAX, value + 1))}
            disabled={value >= MAX}
            className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition border-l border-stone-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Live breakdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-stone-400">=</span>
          <span className="text-sm font-semibold text-indigo-700">{breakdown}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-stone-400">Enter any value between 1 and 720 hours (30 days).</p>
    </div>
  );
}

export default Settings;
