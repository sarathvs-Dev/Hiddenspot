import { useEffect, useState } from 'react';

/** Search input debounce shared by web and mobile, so both query at the same pace. */
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * Returns `value` once it has stopped changing for `delayMs`. Typing stays instant in the
 * input, while searching, URL updates and re-sorting wait for a pause.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
