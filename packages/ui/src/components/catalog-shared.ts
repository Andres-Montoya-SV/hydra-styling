import { useState } from "react";

/** A controlled value never mutates internally; defaults are read only on mount. */
export function useControllable<T>(
  value: T | undefined,
  initial: T,
  onChange?: (value: T) => void,
) {
  const [internal, setInternal] = useState(initial);
  const current = value === undefined ? internal : value;
  function set(next: T) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }
  return [current, set] as const;
}

export const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
