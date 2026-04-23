/**
 * Category Color Map
 * ------------------
 * Maps category color names to actual Tailwind classes.
 * Required because Tailwind can't generate class names from variables.
 *
 * Usage:
 *   const c = categoryColors[category.color];
 *   <div className={c.bg}>...</div>
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
};

// Fallback if a color isn't in the map
export const defaultCategoryColor = categoryColors.indigo;