import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapidly changing values (e.g. search inputs).
 * Prevents continuous API spamming and UI re-renders on every keystroke.
 *
 * @param {any} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @returns {any} debouncedValue
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
