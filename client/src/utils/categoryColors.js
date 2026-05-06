// client/src/utils/categoryColors.js

/**
 * Category Color Map
 * ------------------
 * Maps category color names to actual Tailwind classes.
 * Required because Tailwind can't generate class names from variables.
 *
 * Usage:
 *   const c = categoryColors[category.color];
 *   <div className={c.bg}>...</div>
 *
 * To add a colour: add an entry here with all six fields, then reference
 * the key from server/utils/categories.js (or from a Category document
 * once admin-managed categories ship in Step 1.4).
 */

export const categoryColors = {
  indigo: {
    bg: "bg-indigo-50",
    bgSolid: "bg-indigo-600",
    text: "text-indigo-700",
    textLight: "text-indigo-600",
    border: "border-indigo-200",
    ring: "ring-indigo-500",
    progress: "bg-indigo-500",
  },
  pink: {
    bg: "bg-pink-50",
    bgSolid: "bg-pink-600",
    text: "text-pink-700",
    textLight: "text-pink-600",
    border: "border-pink-200",
    ring: "ring-pink-500",
    progress: "bg-pink-500",
  },
  purple: {
    bg: "bg-purple-50",
    bgSolid: "bg-purple-600",
    text: "text-purple-700",
    textLight: "text-purple-600",
    border: "border-purple-200",
    ring: "ring-purple-500",
    progress: "bg-purple-500",
  },
  amber: {
    bg: "bg-amber-50",
    bgSolid: "bg-amber-600",
    text: "text-amber-700",
    textLight: "text-amber-600",
    border: "border-amber-200",
    ring: "ring-amber-500",
    progress: "bg-amber-500",
  },
  teal: {
    bg: "bg-teal-50",
    bgSolid: "bg-teal-600",
    text: "text-teal-700",
    textLight: "text-teal-600",
    border: "border-teal-200",
    ring: "ring-teal-500",
    progress: "bg-teal-500",
  },
  green: {
    bg: "bg-green-50",
    bgSolid: "bg-green-600",
    text: "text-green-700",
    textLight: "text-green-600",
    border: "border-green-200",
    ring: "ring-green-500",
    progress: "bg-green-500",
  },
  sky: {
    bg: "bg-sky-50",
    bgSolid: "bg-sky-600",
    text: "text-sky-700",
    textLight: "text-sky-600",
    border: "border-sky-200",
    ring: "ring-sky-500",
    progress: "bg-sky-500",
  },
  rose: {
    bg: "bg-rose-50",
    bgSolid: "bg-rose-600",
    text: "text-rose-700",
    textLight: "text-rose-600",
    border: "border-rose-200",
    ring: "ring-rose-500",
    progress: "bg-rose-500",
  },
  red: {
    bg: "bg-red-50",
    bgSolid: "bg-red-600",
    text: "text-red-700",
    textLight: "text-red-600",
    border: "border-red-200",
    ring: "ring-red-500",
    progress: "bg-red-500",
  },
  violet: {
    bg: "bg-violet-50",
    bgSolid: "bg-violet-600",
    text: "text-violet-700",
    textLight: "text-violet-600",
    border: "border-violet-200",
    ring: "ring-violet-500",
    progress: "bg-violet-500",
  },
  fuchsia: {
    bg: "bg-fuchsia-50",
    bgSolid: "bg-fuchsia-600",
    text: "text-fuchsia-700",
    textLight: "text-fuchsia-600",
    border: "border-fuchsia-200",
    ring: "ring-fuchsia-500",
    progress: "bg-fuchsia-500",
  },
  blue: {
    bg: "bg-blue-50",
    bgSolid: "bg-blue-600",
    text: "text-blue-700",
    textLight: "text-blue-600",
    border: "border-blue-200",
    ring: "ring-blue-500",
    progress: "bg-blue-500",
  },
  orange: {
    bg: "bg-orange-50",
    bgSolid: "bg-orange-600",
    text: "text-orange-700",
    textLight: "text-orange-600",
    border: "border-orange-200",
    ring: "ring-orange-500",
    progress: "bg-orange-500",
  },
  emerald: {
    bg: "bg-emerald-50",
    bgSolid: "bg-emerald-600",
    text: "text-emerald-700",
    textLight: "text-emerald-600",
    border: "border-emerald-200",
    ring: "ring-emerald-500",
    progress: "bg-emerald-500",
  },
};

// Fallback if a color isn't in the map
export const defaultCategoryColor = categoryColors.indigo;