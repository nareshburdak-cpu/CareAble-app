/**
 * useDebounce — Debounce any value
 * --------------------------------
 * Returns a value that only updates after `delay` ms
 * of no changes — useful for deferring expensive operations
 * like API calls while the user is still interacting.
 *
 * Usage:
 *   const [query, setQuery] = useState("");
 *   const debounced = useDebounce(query, 500);
 *   useEffect(() => { fetchResults(debounced); }, [debounced]);
 */

import { useEffect, useState } from "react";

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}